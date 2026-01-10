import { Model } from "mongoose";
import { Chat, type ChatDocument } from "../schemas/chat.schema";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import { UsersService } from "src/modules/users/users.service";
import { FaqsService } from "src/modules/faqs/faqs.service";
import { CustomFunctionService } from "../services/custom-function.service";

import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { PredictionLargueService } from "../model-ai/predictionlargue.service";

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
    private readonly promptGen: PromptGeneratorService,
    private readonly predictionService: PredictionService,
    private readonly predictionLargeService: PredictionLargueService,
    private readonly productSearchService: ProductsService,
    private readonly userService: UsersService,
    private readonly faqsService: FaqsService,
    private readonly customFunctionService: CustomFunctionService
  ) {}
  private async runAgentLoop(
    assistantId: string,
    userId: string,
    userMessage: string,
    memoryContext: string
  ) {
    const context = await this.userService.getAssistantById(
      assistantId,
      userId
    );
    if (!context) throw new Error("Assistant not found");

    const availableFunctions =
      await this.customFunctionService.getFunctionsList(userId, assistantId);

    // 🧠 PRIMER PROMPT
    const firstPrompt = this.promptGen.generateUnifiedPrompt(
      context.name,
      context.description,
      memoryContext,
      userMessage,
      availableFunctions
    );

    const firstPrediction = await this.predictionService.predict(firstPrompt);

    let input_tokens = firstPrediction.input_tokens || 0;
    let output_tokens = firstPrediction.output_tokens || 0;

    const functionCall = this.customFunctionService.parseFunctionCall(
      firstPrediction.output
    );

    // ✅ NO hay función → respuesta directa
    if (!functionCall) {
      return {
        response: firstPrediction.output,
        input_tokens,
        output_tokens,
      };
    }

    // 🚀 Ejecutar función
    const functionResult = !["SEARCH", "FAQ", "IMPORTANT_INFO"].includes(
      functionCall.functionName
    )
      ? await this.customFunctionService.executeFunction(
          functionCall.functionName,
          functionCall.parameters,
          userId,
          assistantId
        )
      : null;

    // 🧠 SEGUNDO PROMPT (con resultados)
    const secondPrompt = `
Eres ${context.name}, un asistente que responde de forma clara y natural.

El usuario preguntó:
"${userMessage}"

Ya se ejecutó la función ${functionCall.functionName} con éxito.

RESULTADO DE LA FUNCIÓN:
${JSON.stringify(functionResult?.result, null, 2)}

INSTRUCCIONES OBLIGATORIAS:
- Redacta una respuesta clara para el usuario
- NO llames más funciones
- NO repitas etiquetas técnicas
- Resume lo importante
- Finaliza SIEMPRE con:
[IMPORTANT_INFO: resumen_claro_y_util]
`;

    const secondPrediction = await this.predictionService.predict(secondPrompt);

    input_tokens += secondPrediction.input_tokens || 0;
    output_tokens += secondPrediction.output_tokens || 0;

    return {
      response: secondPrediction.output,
      input_tokens,
      output_tokens,
      funcionesEjecutadas: functionResult
        ? [
            `[${functionCall.functionName}:${functionCall.parameters.join(", ")}]`,
          ]
        : [],
    };
  }

  async createChat(
    userId: string,
    assistantId: string,
    prompt: string
  ): Promise<ChatDocument> {
    const result = await this.runAgentLoop(assistantId, userId, prompt, "");

    const cleanedResponse = this.cleanModelResponse(result.response);
    const importantInfo = this.extractImportantInfo(result.response);

    const chat = new this.chatModel({
      userId,
      messages: [
        {
          role: "user",
          content: prompt,
          createdAt: new Date(),
          important_info: "",
        },
        {
          role: "assistant",
          content: cleanedResponse,
          createdAt: new Date(),
          important_info: this.buildCompleteImportantInfo(
            importantInfo,
            result.funcionesEjecutadas || []
          ),
        },
      ],
      lastActivityAt: new Date(),
      input_tokens: result.input_tokens,
      output_tokens: result.output_tokens,
    });

    return await chat.save();
  }

  async predict(userId: string, prompt: string): Promise<ChatDocument> {
    let input_tokens = 0;
    let output_tokens = 0;

    // 1. Predicción directa (RAW)
    const prediction = await this.predictionLargeService.predictLarge(
      "",
      prompt
    );

    input_tokens = prediction.input_tokens || 0;
    output_tokens = prediction.output_tokens || 0;

    // 2. Mensajes estándar del chat
    const messages = [
      {
        role: "user" as const,
        content: prompt,
        createdAt: new Date(),
        important_info: "",
      },
      {
        role: "assistant" as const,
        content: prediction.output,
        createdAt: new Date(),
        important_info: "",
      },
    ];

    // 3. Crear chat con TODAS las variables base
    const chat = new this.chatModel({
      userId,
      messages,
      lastActivityAt: new Date(),
      input_tokens,
      output_tokens,
    });

    // 4. Guardar
    return await chat.save();
  }

  async singlePredict(userId: string, prompt: string): Promise<ChatDocument> {
    let input_tokens = 0;
    let output_tokens = 0;

    // 1. Predicción directa (RAW)
    const prediction = await this.predictionService.predict(prompt);

    input_tokens = prediction.input_tokens || 0;
    output_tokens = prediction.output_tokens || 0;

    // 2. Mensajes estándar del chat
    const messages = [
      {
        role: "user" as const,
        content: prompt,
        createdAt: new Date(),
        important_info: "",
      },
      {
        role: "assistant" as const,
        content: prediction.output,
        createdAt: new Date(),
        important_info: "",
      },
    ];

    // 3. Crear chat con TODAS las variables base
    const chat = new this.chatModel({
      userId,
      messages,
      lastActivityAt: new Date(),
      input_tokens,
      output_tokens,
    });

    // 4. Guardar
    return await chat.save();
  }

  async addMessage(
    chatId: string,
    assistantId: string,
    role: "user" | "assistant",
    content: string
  ) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    if (role !== "user") return chat;

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $push: {
          messages: {
            role: "user",
            content,
            createdAt: new Date(),
            important_info: "",
          },
        },
      }
    );

    const memoryContext = this.buildEnhancedMemoryContext(chat.messages);

    const result = await this.runAgentLoop(
      assistantId,
      chat.userId,
      content,
      memoryContext
    );

    const cleanedResponse = this.cleanModelResponse(result.response);
    const importantInfo = this.extractImportantInfo(result.response);

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $push: {
          messages: {
            role: "assistant",
            content: cleanedResponse,
            createdAt: new Date(),
            important_info: this.buildCompleteImportantInfo(
              importantInfo,
              result.funcionesEjecutadas || []
            ),
          },
        },
        $inc: {
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
        },
        $set: { lastActivityAt: new Date() },
      }
    );

    return this.chatModel.findById(chatId);
  }

  async getChat(chatId: string) {
    return this.chatModel.findById(chatId);
  }

  async getUserChats(userId: string) {
    return this.chatModel.find({ userId }).sort({ lastActivityAt: -1 });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async processModelResponse(
    response: string,
    userId: string,
    assistantId: string
  ) {
    let faqInfo = "";
    let productosString = "";
    const functionResults: any[] = [];
    const funcionesEjecutadas: string[] = [];

    // Buscar FAQ directamente en el texto
    const faqMatch = response.match(/\[FAQ:([^\]]+)\]/);

    if (faqMatch) {
      const faqQuery = faqMatch[1].trim();
      funcionesEjecutadas.push(`[FAQ:${faqQuery}]`);

      const faqResults = await this.faqsService.search(
        faqQuery,
        userId,
        assistantId
      );

      if (faqResults && faqResults.length > 0) {
        faqInfo = faqResults[0].answer;
      } else {
        faqInfo = "No se encontró información de FAQ para esa pregunta.";
      }
    }

    // Buscar SEARCH directamente en el texto
    const searchMatch = response.match(/\[SEARCH:([^\]]+)\]/);

    if (searchMatch) {
      const searchTerm = searchMatch[1].trim();
      funcionesEjecutadas.push(`[SEARCH:${searchTerm}]`);

      const relatedProducts = await this.productSearchService.search(
        searchTerm,
        userId
      );

      if (relatedProducts.length === 0) {
        productosString = "No se encontraron productos con ese término.";
      } else {
        productosString = relatedProducts.map((p) => p.name).join(", ");
      }
    }

    // Buscar y ejecutar funciones personalizadas
    const functionCall = this.customFunctionService.parseFunctionCall(response);

    if (functionCall) {
      // Validar que no sea una función del sistema (SEARCH, FAQ, IMPORTANT_INFO)
      // These are handled above or are meta-tags.
      if (
        !["SEARCH", "FAQ", "IMPORTANT_INFO"].includes(functionCall.functionName)
      ) {
        const functionResult = await this.customFunctionService.executeFunction(
          functionCall.functionName,
          functionCall.parameters,
          userId,
          assistantId
        );

        functionResults.push(functionResult);
        funcionesEjecutadas.push(
          `[${functionCall.functionName}:${functionCall.parameters.join(", ")}]`
        );
      } else {
        console.log(
          `Skipping system function in custom function execution check: ${functionCall.functionName}`
        );
      }
    } else {
      console.log("No custom function call found in response");
    }

    // Extraer IMPORTANT_INFO from the analysis response (if present, though it should be in final response)
    // This is now primarily extracted from the *final* prediction.
    const importantInfoFromAnalysis = this.extractImportantInfo(response);

    const result = {
      faqInfo,
      productosString,
      functionResults,
      funcionesEjecutadas,
      importantInfo: importantInfoFromAnalysis, // This will likely be empty or a placeholder from analysis prompt
    };

    return result;
  }

  private extractImportantInfo(response: string): string {
    const importantInfoMatch = response.match(/\[IMPORTANT_INFO:([^\]]+)\]/);
    return importantInfoMatch ? importantInfoMatch[1].trim() : "";
  }

  private cleanModelResponse(response: string): string {
    // Remove all known tags from the final response to the user
    return response
      .replace(/\[FAQ:.*?\]/gi, "")
      .replace(/\[SEARCH:.*?\]/gi, "")
      .replace(/\[[A-Z_]+:.*?\]/gi, "") // Remove custom functions and other tags like FUNCTIONS_EJECUTADAS
      .replace(/\[IMPORTANT_INFO:.*?\]/gi, "")
      .replace(/Respuesta:\s*/gi, "") // Remove any "Respuesta:" prefix if model adds it
      .trim();
  }

  private buildCompleteImportantInfo(
    importantInfo: string,
    funcionesEjecutadas: string[]
  ): string {
    const funcionesStr = funcionesEjecutadas.length
      ? ` [FUNCIONES_EJECUTADAS: ${funcionesEjecutadas.join(" ")}]`
      : "";
    // Ensure importantInfo is not empty or just a placeholder like "lo_que_necesita"
    const finalImportantInfoContent =
      importantInfo && importantInfo !== "lo_que_necesita"
        ? importantInfo
        : "información general"; // Default if model doesn't provide specific info

    return `[IMPORTANT_INFO: ${finalImportantInfoContent}${funcionesStr}]`;
  }

  private buildEnhancedMemoryContext(messages: any[]): string {
    const memoryParts: string[] = [];

    // Get the last 4 messages (2 user-assistant exchanges) for better context
    // Filter out user messages that don't have important_info (which they shouldn't)
    const recentMessages = messages
      .filter(
        (msg) =>
          msg.role === "assistant" ||
          (msg.role === "user" && messages.indexOf(msg) > messages.length - 5)
      )
      .slice(-4);

    for (let i = 0; i < recentMessages.length; i += 2) {
      const userMsg = recentMessages[i];
      const assistantMsg = recentMessages[i + 1];

      if (
        userMsg &&
        assistantMsg &&
        userMsg.role === "user" &&
        assistantMsg.role === "assistant"
      ) {
        const userContent = userMsg.content || "";
        const assistantImportantInfo = assistantMsg.important_info || "";

        // Extract main info and executed functions from assistant's important_info
        let mainInfo = "";
        let functionsUsed = "";

        const mainInfoMatch = assistantImportantInfo.match(
          /\[IMPORTANT_INFO: ([^[]+)/
        );
        if (mainInfoMatch && mainInfoMatch[1].trim() !== "lo_que_necesita") {
          mainInfo = mainInfoMatch[1].trim();
        }

        const functionsMatch = assistantImportantInfo.match(
          /\[FUNCIONES_EJECUTADAS: ([^\]]+)\]/
        );
        if (functionsMatch) {
          functionsUsed = functionsMatch[1];
        }

        memoryParts.push(
          `Usuario preguntó: "${userContent}" | Asistente respondió sobre: ${mainInfo || "información general"} | Funciones usadas: ${functionsUsed || "ninguna"}`
        );
      }
    }

    return memoryParts.length > 0
      ? `CONVERSACIÓN PREVIA: ${memoryParts.join(" || ")}`
      : "";
  }
  async voiceChat(
    chatId: string,
    assistantId: string,
    audioBase64: string
  ): Promise<{ audio: string }> {
    // 1️⃣ Transcribir audio a texto usando tu PredictionService (Whisper)
    const asrPrompt = `Transcribe este audio a texto: ${audioBase64}`;
    const asrPrediction = await this.predictionService.predict(asrPrompt);
    const userText = asrPrediction.output || "";

    // 2️⃣ Reutilizar addMessage para procesar la conversación
    const chatAfterMessage = await this.addMessage(
      chatId,
      assistantId,
      "user",
      userText
    );

    if (!chatAfterMessage) {
      throw new Error(`Chat with chatId ${chatId} not found`);
    }

    // 3️⃣ Obtener último mensaje del asistente
    const lastMessage =
      chatAfterMessage.messages[chatAfterMessage.messages.length - 1];
    const botText = lastMessage.content;

    // 4️⃣ Convertir respuesta a audio usando PredictionService (TTS)
    const ttsPrompt = `Convierte este texto a audio en formato base64: ${botText}`;
    const ttsPrediction = await this.predictionService.predict(ttsPrompt);
    const audioResponseBase64 = ttsPrediction.output || "";

    return { audio: audioResponseBase64 };
  }
}
