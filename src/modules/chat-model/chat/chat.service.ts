import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Chat, ChatDocument } from "../schemas/chat.schema";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import { UsersService } from "src/modules/users/users.service";
import { FaqsService } from "src/modules/faqs/faqs.service";

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    private readonly promptGen: PromptGeneratorService,
    private readonly predictionService: PredictionService,
    private readonly productSearchService: ProductsService,
    private readonly userService: UsersService,
    private readonly faqsService: FaqsService
  ) {}

  async createChat(userId: string, promt: string): Promise<ChatDocument> {
    let input_tokens = 0;
    let output_tokens = 0;
    const context = await this.userService.getAssistantChatByUserId(userId);

    if (!context) {
      throw new Error(`No context found for userId ${userId}`);
    }

    // Paso 1: Analizar intención y ejecutar funciones
    const analysisPrompt = this.promptGen.generateInitialPromt(
      context.name,
      context.description,
      "",
      promt
    );

    const analysisPrediction =
      await this.predictionService.predict(analysisPrompt);
    input_tokens += analysisPrediction.input_tokens || 0;
    output_tokens += analysisPrediction.output_tokens || 0;

    // Extraer respuesta inicial del modelo
    const initialResponse = this.extractInitialResponse(
      analysisPrediction.output
    );

    // Procesar funciones identificadas
    const processedResult = await this.processModelResponse(
      analysisPrediction.output,
      userId,
      context._id?.toString() ?? ""
    );

    // Paso 2: Generar respuesta final con información recopilada
    const finalPrompt = this.promptGen.generateContextualPrompt("", promt, {
      faqInfo: processedResult.faqInfo,
      productosString: processedResult.productosString,
      carrito: "",
    });

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

      // Construir contexto de memoria mejorado
      const memoryContext = this.buildEnhancedMemoryContext(chat.messages);

      // Paso 1: Analizar intención del nuevo mensaje
      const analysisPrompt = this.promptGen.generateMessagePromt(
        memoryContext,
        "",
        "",
        "",
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
        chat._id?.toString() ?? ""
      );

      // Paso 2: Generar respuesta final
      const finalPrompt = this.promptGen.generateContextualPrompt(
        memoryContext,
        content,
        {
          faqInfo: processedResult.faqInfo,
          productosString: processedResult.productosString,
          carrito: "",
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

  private async processModelResponse(
    response: string,
    userId: string,
    assistantId: string
  ) {
    let faqInfo = "";
    let productosString = "";
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
        console.log("No FAQ results found");
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

    // Extraer IMPORTANT_INFO
    const importantInfo = this.extractImportantInfo(response);

    const result = {
      faqInfo,
      productosString,
      funcionesEjecutadas,
      importantInfo,
    };

    return result;
  }

  private extractInitialResponse(response: string): string {
    // Buscar el texto después de "Respuesta:"
    const responseMatch = response.match(/Respuesta:\s*(.+?)(?:\[|$)/s);
    return responseMatch ? responseMatch[1].trim() : "";
  }

  private extractImportantInfo(response: string): string {
    const importantInfoMatch = response.match(/\[IMPORTANT_INFO:([^\]]+)\]/);
    return importantInfoMatch ? importantInfoMatch[1].trim() : "";
  }

  private cleanModelResponse(response: string): string {
    return response
      .replace(/\[FAQ:.*?\]/gi, "")
      .replace(/\[SEARCH:.*?\]/gi, "")
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
