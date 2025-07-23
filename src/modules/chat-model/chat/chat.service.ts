import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Chat, ChatDocument } from "../schemas/chat.schema";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import { UsersService } from "src/modules/users/users.service";
import { FaqsService } from "src/modules/faqs/faqs.service";
import { CustomFunctionService } from "../services/custom-function.service";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    private readonly promptGen: PromptGeneratorService,
    private readonly predictionService: PredictionService,
    private readonly productSearchService: ProductsService,
    private readonly userService: UsersService,
    private readonly faqsService: FaqsService,
    private readonly customFunctionService: CustomFunctionService
  ) {}

  async createChat(
    userId: string,
    assistantId: string,
    promt: string
  ): Promise<ChatDocument> {
    let input_tokens = 0;
    let output_tokens = 0;

    // Obtener el contexto del asistente específico
    const context = await this.userService.getAssistantById(
      assistantId,
      userId
    );

    if (!context) {
      throw new Error(
        `No assistant found with id ${assistantId} for userId ${userId}`
      );
    }

    // Obtener funciones disponibles del asistente específico
    const availableFunctions =
      await this.customFunctionService.getFunctionsList(userId, assistantId);

    availableFunctions.forEach((func) => {
      this.logger.log(`- ${func.name}: ${func.description}`);
    });

    // Paso 1: Analizar intención y ejecutar funciones (PRIMERA PREDICCIÓN)
    const analysisPrompt = this.promptGen.generateAnalysisPrompt(
      context.name,
      context.description,
      availableFunctions,
      promt
    );

    const analysisPrediction =
      await this.predictionService.predict(analysisPrompt);
    input_tokens += analysisPrediction.input_tokens || 0;
    output_tokens += analysisPrediction.output_tokens || 0;

    // Procesar funciones identificadas
    const processedResult = await this.processModelResponse(
      analysisPrediction.output,
      userId,
      assistantId
    );

    // Paso 2: Generar respuesta final con información recopilada (SEGUNDA PREDICCIÓN)
    const finalPrompt = this.promptGen.generateContextualPrompt(
      context.name, // Pass assistant name
      context.description, // Pass assistant description
      "", // No memory context for the very first message
      promt,
      {
        faqInfo: processedResult.faqInfo,
        productosString: processedResult.productosString,
        carrito: "", // Not implemented yet
        functionResults: processedResult.functionResults,
      }
    );

    const finalPrediction = await this.predictionService.predict(finalPrompt);
    input_tokens += finalPrediction.input_tokens || 0;
    output_tokens += finalPrediction.output_tokens || 0;

    // Procesar respuesta final
    const cleanedResponse = this.cleanModelResponse(finalPrediction.output);
    const finalImportantInfo = this.extractImportantInfo(
      finalPrediction.output
    );

    // Construir important_info completo
    const completeImportantInfo = this.buildCompleteImportantInfo(
      finalImportantInfo,
      processedResult.funcionesEjecutadas
    );

    // Guardar mensajes
    const messages = [
      {
        role: "user" as const,
        content: promt,
        createdAt: new Date(),
        important_info: "", // User messages don't have important_info
      },
      {
        role: "assistant" as const,
        content: cleanedResponse,
        createdAt: new Date(),
        important_info: completeImportantInfo,
      },
    ];

    const chat = new this.chatModel({
      userId,
      messages,
      lastActivityAt: new Date(),
      input_tokens,
      output_tokens,
    });

    return chat.save();
  }

  async addMessage(
    chatId: string,
    assistantId: string,
    role: "user" | "assistant",
    content: string
  ) {
    const chat = await this.chatModel.findOne({ _id: chatId });
    if (!chat) throw new Error(`Chat with chatId ${chatId} not found`);

    if (role === "user") {
      // Guardar mensaje del usuario
      await this.chatModel.findOneAndUpdate(
        { _id: chatId },
        {
          $push: {
            messages: {
              role,
              content,
              createdAt: new Date(),
              important_info: "",
            },
          },
          $set: { lastActivityAt: new Date() },
        }
      );

      // Obtener contexto del asistente específico
      const context = await this.userService.getAssistantById(
        assistantId,
        chat.userId
      );
      if (!context) {
        throw new Error(
          `Assistant ${assistantId} not found for user ${chat.userId}`
        );
      }

      const availableFunctions =
        await this.customFunctionService.getFunctionsList(
          chat.userId,
          assistantId
        );

      // Construir contexto de memoria mejorado
      const memoryContext = this.buildEnhancedMemoryContext(chat.messages);

      // Paso 1: Analizar intención del nuevo mensaje (PRIMERA PREDICCIÓN)
      const analysisPrompt = this.promptGen.generateAnalysisPrompt(
        context.name,
        context.description,
        availableFunctions,
        content
      );

      const analysisPrediction =
        await this.predictionService.predict(analysisPrompt);
      let input_tokens = analysisPrediction.input_tokens || 0;
      let output_tokens = analysisPrediction.output_tokens || 0;

      // Procesar funciones identificadas
      const processedResult = await this.processModelResponse(
        analysisPrediction.output,
        chat.userId,
        assistantId
      );

      // Paso 2: Generar respuesta final (SEGUNDA PREDICCIÓN)
      const finalPrompt = this.promptGen.generateContextualPrompt(
        context.name, // Pass assistant name
        context.description, // Pass assistant description
        memoryContext,
        content,
        {
          faqInfo: processedResult.faqInfo,
          productosString: processedResult.productosString,
          carrito: "", // Not implemented yet
          functionResults: processedResult.functionResults,
        }
      );

      const finalPrediction = await this.predictionService.predict(finalPrompt);
      input_tokens += finalPrediction.input_tokens || 0;
      output_tokens += finalPrediction.output_tokens || 0;

      // Procesar respuesta final
      const cleanedResponse = this.cleanModelResponse(finalPrediction.output);
      const newImportantInfo = this.extractImportantInfo(
        finalPrediction.output
      );

      // Construir important_info completo
      const completeImportantInfo = this.buildCompleteImportantInfo(
        newImportantInfo,
        processedResult.funcionesEjecutadas
      );

      // Guardar respuesta del asistente
      await this.chatModel.findOneAndUpdate(
        { _id: chatId },
        {
          $push: {
            messages: {
              role: "assistant",
              content: cleanedResponse,
              createdAt: new Date(),
              important_info: completeImportantInfo,
            },
          },
          $set: { lastActivityAt: new Date() },
          $inc: {
            input_tokens: input_tokens,
            output_tokens: output_tokens,
          },
        }
      );
    }

    return this.chatModel.findOne({ _id: chatId });
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
        this.logger.log(
          `Skipping system function in custom function execution check: ${functionCall.functionName}`
        );
      }
    } else {
      this.logger.log("No custom function call found in response");
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
}
