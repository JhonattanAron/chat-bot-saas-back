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

    this.logger.log(`=== STARTING CHAT ===`);
    this.logger.log(`User: ${userId}`);
    this.logger.log(`Assistant: ${assistantId} (${context.name})`);
    this.logger.log(`Prompt: ${promt}`);

    // Obtener funciones disponibles del asistente específico
    const availableFunctions =
      await this.customFunctionService.getFunctionsList(userId, assistantId);

    this.logger.log(`Available functions: ${availableFunctions.length}`);
    availableFunctions.forEach((func) => {
      this.logger.log(`- ${func.name}: ${func.description}`);
    });

    // Paso 1: Analizar intención y ejecutar funciones
    const analysisPrompt = this.promptGen.generateInitialPromt(
      context.name,
      context.description,
      availableFunctions,
      promt
    );

    this.logger.log("=== ANALYSIS PROMPT ===");
    this.logger.log(analysisPrompt);

    const analysisPrediction =
      await this.predictionService.predict(analysisPrompt);
    input_tokens += analysisPrediction.input_tokens || 0;
    output_tokens += analysisPrediction.output_tokens || 0;

    this.logger.log("=== ANALYSIS RESPONSE ===");
    this.logger.log(analysisPrediction.output);

    // DEBUGGING: Verificar qué patrones encuentra
    this.logger.log("=== PATTERN DETECTION ===");
    const searchMatch = analysisPrediction.output.match(/\[SEARCH:([^\]]+)\]/);
    const faqMatch = analysisPrediction.output.match(/\[FAQ:([^\]]+)\]/);
    const functionMatch = analysisPrediction.output.match(
      /\[([A-Z_]+):([^\]]*)\]/
    );

    this.logger.log(
      `SEARCH pattern found: ${searchMatch ? searchMatch[0] : "NO"}`
    );
    this.logger.log(`FAQ pattern found: ${faqMatch ? faqMatch[0] : "NO"}`);
    this.logger.log(
      `Function pattern found: ${functionMatch ? functionMatch[0] : "NO"}`
    );

    // Procesar funciones identificadas
    const processedResult = await this.processModelResponse(
      analysisPrediction.output,
      userId,
      assistantId
    );

    this.logger.log("=== PROCESSED RESULT ===");
    this.logger.log(JSON.stringify(processedResult, null, 2));

    // Paso 2: Generar respuesta final con información recopilada
    const finalPrompt = this.promptGen.generateContextualPrompt("", promt, {
      faqInfo: processedResult.faqInfo,
      productosString: processedResult.productosString,
      carrito: "",
      functionResults: processedResult.functionResults,
    });

    this.logger.log("=== FINAL PROMPT ===");
    this.logger.log(finalPrompt);

    const finalPrediction = await this.predictionService.predict(finalPrompt);
    input_tokens += finalPrediction.input_tokens || 0;
    output_tokens += finalPrediction.output_tokens || 0;

    this.logger.log("=== FINAL RESPONSE ===");
    this.logger.log(finalPrediction.output);

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

    this.logger.log("=== FINAL CLEANED RESPONSE ===");
    this.logger.log("Cleaned:", cleanedResponse);
    this.logger.log("Important Info:", completeImportantInfo);

    // Guardar mensajes
    const messages = [
      {
        role: "user" as const,
        content: promt,
        createdAt: new Date(),
        important_info: "",
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
    const chat = await this.chatModel.findOne({ $or: [{ _id: chatId }] });
    if (!chat) throw new Error(`Chat with chatId ${chatId} not found`);

    if (role === "user") {
      // Guardar mensaje del usuario
      await this.chatModel.findOneAndUpdate(
        { $or: [{ _id: chatId }] },
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

      this.logger.log("=== MEMORY CONTEXT ===");
      this.logger.log(memoryContext);

      // Paso 1: Analizar intención del nuevo mensaje
      const analysisPrompt = this.promptGen.generateMessagePromt(
        memoryContext,
        "",
        "",
        "",
        content,
        availableFunctions
      );

      this.logger.log("=== ANALYSIS PROMPT (ADD MESSAGE) ===");
      this.logger.log(analysisPrompt);

      const analysisPrediction =
        await this.predictionService.predict(analysisPrompt);
      let input_tokens = analysisPrediction.input_tokens || 0;
      let output_tokens = analysisPrediction.output_tokens || 0;

      this.logger.log("=== ANALYSIS RESPONSE (ADD MESSAGE) ===");
      this.logger.log(analysisPrediction.output);

      // Procesar funciones identificadas
      const processedResult = await this.processModelResponse(
        analysisPrediction.output,
        chat.userId,
        assistantId
      );

      this.logger.log("=== PROCESSED RESULT (ADD MESSAGE) ===");
      this.logger.log(JSON.stringify(processedResult, null, 2));

      // Paso 2: Generar respuesta final
      const finalPrompt = this.promptGen.generateContextualPrompt(
        memoryContext,
        content,
        {
          faqInfo: processedResult.faqInfo,
          productosString: processedResult.productosString,
          carrito: "",
          functionResults: processedResult.functionResults,
        }
      );

      const finalPrediction = await this.predictionService.predict(finalPrompt);
      input_tokens += finalPrediction.input_tokens || 0;
      output_tokens += finalPrediction.output_tokens || 0;

      this.logger.log("=== FINAL RESPONSE (ADD MESSAGE) ===");
      this.logger.log(finalPrediction.output);

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
        { $or: [{ _id: chatId }] },
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

    return this.chatModel.findOne({ $or: [{ _id: chatId }] });
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

    this.logger.log("=== PROCESSING MODEL RESPONSE ===");
    this.logger.log("Raw response:", response);

    // Buscar FAQ directamente en el texto
    const faqMatch = response.match(/\[FAQ:([^\]]+)\]/);
    if (faqMatch) {
      const faqQuery = faqMatch[1].trim();
      funcionesEjecutadas.push(`[FAQ:${faqQuery}]`);
      this.logger.log("=== EXECUTING FAQ SEARCH ===");
      this.logger.log("FAQ Query:", faqQuery);

      const faqResults = await this.faqsService.search(
        faqQuery,
        userId,
        assistantId
      );
      this.logger.log("FAQ Results:", faqResults);

      if (faqResults && faqResults.length > 0) {
        faqInfo = faqResults[0].answer;
        this.logger.log("FAQ Info found:", faqInfo);
      } else {
        this.logger.log("No FAQ results found");
      }
    }

    // Buscar SEARCH directamente en el texto
    const searchMatch = response.match(/\[SEARCH:([^\]]+)\]/);
    if (searchMatch) {
      const searchTerm = searchMatch[1].trim();
      funcionesEjecutadas.push(`[SEARCH:${searchTerm}]`);
      this.logger.log("=== EXECUTING PRODUCT SEARCH ===");
      this.logger.log("Search Term:", searchTerm);

      const relatedProducts = await this.productSearchService.search(
        searchTerm,
        userId
      );
      this.logger.log("Product Results:", relatedProducts);

      if (relatedProducts.length === 0) {
        productosString = "No se encontraron productos con ese término.";
      } else {
        productosString = relatedProducts.map((p) => p.name).join(", ");
      }
      this.logger.log("Products String:", productosString);
    }

    // Buscar y ejecutar funciones personalizadas
    const functionCall = this.customFunctionService.parseFunctionCall(response);
    if (functionCall) {
      this.logger.log("=== EXECUTING CUSTOM FUNCTION ===");
      this.logger.log("Function:", functionCall.functionName);
      this.logger.log("Parameters:", functionCall.parameters);

      // Validar que no sea una función del sistema (SEARCH, FAQ)
      if (
        !["SEARCH", "FAQ", "IMPORTANT_INFO"].includes(functionCall.functionName)
      ) {
        const functionResult = await this.customFunctionService.executeFunction(
          functionCall.functionName,
          functionCall.parameters,
          userId,
          assistantId
        );

        this.logger.log(
          "Function Result:",
          JSON.stringify(functionResult, null, 2)
        );

        functionResults.push(functionResult);
        funcionesEjecutadas.push(
          `[${functionCall.functionName}:${functionCall.parameters.join(", ")}]`
        );
      } else {
        this.logger.log(
          `Skipping system function: ${functionCall.functionName}`
        );
      }
    } else {
      this.logger.log("No custom function call found in response");
    }

    // Extraer IMPORTANT_INFO
    const importantInfo = this.extractImportantInfo(response);
    this.logger.log("Important Info extracted:", importantInfo);

    const result = {
      faqInfo,
      productosString,
      functionResults,
      funcionesEjecutadas,
      importantInfo,
    };

    this.logger.log("=== FINAL PROCESSED RESULT ===");
    this.logger.log(JSON.stringify(result, null, 2));

    return result;
  }

  private extractImportantInfo(response: string): string {
    const importantInfoMatch = response.match(/\[IMPORTANT_INFO:([^\]]+)\]/);
    return importantInfoMatch ? importantInfoMatch[1].trim() : "";
  }

  private cleanModelResponse(response: string): string {
    return response
      .replace(/\[FAQ:.*?\]/gi, "")
      .replace(/\[SEARCH:.*?\]/gi, "")
      .replace(/\[[A-Z_]+:.*?\]/gi, "") // Remover funciones personalizadas
      .replace(/\[FUNCTIONS:.*?\]/gi, "")
      .replace(/\[IMPORTANT_INFO:.*?\]/gi, "")
      .replace(/Respuesta:\s*/gi, "")
      .trim();
  }

  private buildCompleteImportantInfo(
    importantInfo: string,
    funcionesEjecutadas: string[]
  ): string {
    const funcionesStr = funcionesEjecutadas.length
      ? ` [FUNCIONES_EJECUTADAS: ${funcionesEjecutadas.join(" ")}]`
      : "";
    return `[IMPORTANT_INFO: ${importantInfo}${funcionesStr}]`;
  }

  private buildEnhancedMemoryContext(messages: any[]): string {
    const memoryParts: string[] = [];

    // Obtener los últimos 4 mensajes (2 intercambios) para mejor contexto
    const recentMessages = messages.slice(-4);

    for (let i = 0; i < recentMessages.length; i += 2) {
      const userMsg = recentMessages[i];
      const assistantMsg = recentMessages[i + 1];

      if (userMsg && assistantMsg) {
        const userContent = userMsg.content || "";
        const assistantContent = assistantMsg.content || "";
        const importantInfo = assistantMsg.important_info || "";

        // Extraer información clave del important_info
        let contextInfo = "";
        if (importantInfo.includes("FUNCIONES_EJECUTADAS")) {
          const funcionesMatch = importantInfo.match(
            /\[FUNCIONES_EJECUTADAS: ([^\]]+)\]/
          );
          if (funcionesMatch) {
            contextInfo = funcionesMatch[1];
          }
        }

        // Extraer el tema principal del important_info
        const mainInfoMatch = importantInfo.match(/\[IMPORTANT_INFO: ([^[]+)/);
        const mainInfo = mainInfoMatch ? mainInfoMatch[1].trim() : "";

        memoryParts.push(
          `Usuario preguntó: "${userContent}" | Asistente respondió sobre: ${mainInfo} | Funciones usadas: ${contextInfo}`
        );
      }
    }

    return memoryParts.length > 0
      ? `CONVERSACIÓN PREVIA: ${memoryParts.join(" || ")}`
      : "";
  }
}
