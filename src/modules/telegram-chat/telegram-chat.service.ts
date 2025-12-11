import { Injectable, Logger } from "@nestjs/common";
import { Model, Types } from "mongoose";
import {
  TelegramChat,
  TelegramChatDocument,
} from "./schemas/telegram-chat.schema";
import {
  TelegramBot,
  TelegramBotDocument,
} from "./schemas/telegram-bot.schema";
import { PromptGeneratorService } from "../chat-model/config/prompt-generator.service";
import { PredictionService } from "../chat-model/model-ai/predictions.service";
import { ProductsService } from "../products/products.service";
import { UsersService } from "../users/users.service";
import { FaqsService } from "../faqs/faqs.service";
import { CustomFunctionService } from "../chat-model/services/custom-function.service";
import { error } from "console";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class TelegramChatService {
  private readonly logger = new Logger(TelegramChatService.name);
  private telegramClients: Map<string, any> = new Map();

  constructor(
    @InjectModel(TelegramChat.name)
    private readonly telegramChatModel: Model<TelegramChatDocument>,

    @InjectModel(TelegramBot.name)
    private readonly telegramBotModel: Model<TelegramBotDocument>,

    private readonly promptGen: PromptGeneratorService,
    private readonly predictionService: PredictionService,
    private readonly productSearchService: ProductsService,
    private readonly userService: UsersService,
    private readonly faqsService: FaqsService,
    private readonly customFunctionService: CustomFunctionService
  ) {}

  async connectBot(
    token: string,
    userId: string,
    assistantId: string
  ): Promise<TelegramBotDocument> {
    try {
      // Validar el token con Telegram API
      const botInfo = await this.validateBotToken(token);

      // Verificar si el bot ya existe
      const existingBot = await this.telegramBotModel.findOne({ token });
      if (existingBot) {
        throw new Error("Bot already connected");
      }

      // Guardar bot en base de datos
      const bot = new this.telegramBotModel({
        token,
        userId,
        assistantId,
        botName: botInfo.first_name,
        botUsername: botInfo.username,
        botId: botInfo.id.toString(),
        botInfo,
        connectedAt: new Date(),
        lastActivityAt: new Date(),
      });

      const savedBot = await bot.save();
      const webhook = await this.setTelegramWebhook(token);

      // Agregar cliente al mapa en memoria
      this.telegramClients.set((savedBot._id as Types.ObjectId).toString(), {
        token,
        botInfo,
        userId,
        assistantId,
      });

      this.logger.log(
        `Bot connected: ${webhook} ${botInfo.username} (${botInfo.id})`
      );
      return savedBot;
    } catch (error) {
      this.logger.error("Error connecting bot:", error);
      throw error;
    }
  }
  private async setTelegramWebhook(botToken: string) {
    const webhookUrl = `${process.env.PUBLIC_URL}/telegram-chat/webhook/${botToken}`;

    const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      throw new Error("Failed to set webhook: " + data.description);
    }

    this.logger.log("Webhook registered successfully: " + webhookUrl);
  }

  async disconnectBot(botId: string): Promise<boolean> {
    try {
      // Eliminar de base de datos
      const result = await this.telegramBotModel.deleteOne({ _id: botId });

      // Eliminar del mapa en memoria
      this.telegramClients.delete(botId);

      this.logger.log(`Bot disconnected: ${botId}`);
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error("Error disconnecting bot:", error);
      throw error;
    }
  }

  async getConnectedBots(userId?: string): Promise<TelegramBotDocument[]> {
    const filter = userId ? { userId } : {};
    return this.telegramBotModel.find(filter).sort({ connectedAt: -1 });
  }

  async sendMessageWithBot(
    botId: string,
    chatId: string,
    message: string
  ): Promise<any> {
    const client = this.telegramClients.get(botId);
    if (!client) {
      throw new Error("Bot not found or not connected");
    }

    return this.sendTelegramMessage(client.token, chatId, message);
  }

  private async validateBotToken(token: string): Promise<any> {
    try {
      const url = `https://api.telegram.org/bot${token}/getMe`;
      const response = await fetch(url);
      const result = await response.json();

      if (!result.ok) {
        throw new Error("Invalid bot token");
      }

      return result.result;
    } catch (error) {
      throw new Error("Failed to validate bot token");
    }
  }

  private async findBotByToken(
    token: string
  ): Promise<TelegramBotDocument | null> {
    return this.telegramBotModel.findOne({ token, isActive: true });
  }

  async createTelegramChat(
    userId: string,
    assistantId: string,
    telegramChatId: string,
    telegramUserId: string,
    message: string,
    username?: string,
    firstName?: string,
    lastName?: string,
    messageId?: number
  ): Promise<TelegramChatDocument | null> {
    let input_tokens = 0;
    let output_tokens = 0;

    // Verificar si ya existe un chat para este telegramChatId
    const existingChat = await this.telegramChatModel.findOne({
      telegramChatId,
    });

    if (existingChat) {
      // Si existe, agregar el mensaje y generar respuesta
      return this.addTelegramMessage(
        (existingChat._id as Types.ObjectId).toString(),
        assistantId,
        "user",
        message,
        messageId
      );
    }

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

    // Paso 1: Analizar intención y ejecutar funciones (PRIMERA PREDICCIÓN)
    const analysisPrompt = this.promptGen.generateAnalysisPrompt(
      context.name,
      context.description,
      availableFunctions,
      message
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
      context.name,
      context.description,
      "", // No memory context for the very first message
      message,
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
        content: message,
        createdAt: new Date(),
        important_info: "",
        messageId: messageId,
        messageType: "text",
      },
      {
        role: "assistant" as const,
        content: cleanedResponse,
        createdAt: new Date(),
        important_info: completeImportantInfo,
        messageType: "text",
      },
    ];

    const telegramChat = new this.telegramChatModel({
      userId,
      assistantId,
      telegramChatId,
      telegramUserId,
      username: username || "",
      firstName: firstName || "",
      lastName: lastName || "",
      messages,
      lastActivityAt: new Date(),
      input_tokens,
      output_tokens,
      telegramMetadata: {
        chatType: "private",
        isBot: false,
      },
    });

    return telegramChat.save();
  }

  async addTelegramMessage(
    chatId: string,
    assistantId: string,
    role: "user" | "assistant",
    content: string,
    messageId?: number,
    messageType = "text",
    mediaUrl?: string,
    replyToMessageId?: number
  ) {
    const chat = await this.telegramChatModel.findOne({ _id: chatId });
    if (!chat) {
      throw new Error("Chat no encontrado");
    }
    if (!chat) throw new Error(`Telegram chat with chatId ${chatId} not found`);

    if (role === "user") {
      // Guardar mensaje del usuario
      await this.telegramChatModel.findOneAndUpdate(
        { _id: chatId },
        {
          $push: {
            messages: {
              role,
              content,
              createdAt: new Date(),
              important_info: "",
              messageId,
              messageType,
              mediaUrl,
              replyToMessageId,
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
        context.name,
        context.description,
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
      await this.telegramChatModel.findOneAndUpdate(
        { _id: chatId },
        {
          $push: {
            messages: {
              role: "assistant",
              content: cleanedResponse,
              createdAt: new Date(),
              important_info: completeImportantInfo,
              messageType: "text",
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

    return this.telegramChatModel.findOne({ _id: chatId });
  }

  async getTelegramChat(chatId: string) {
    return this.telegramChatModel.findById(chatId);
  }

  async getTelegramChatByTelegramId(telegramChatId: string) {
    return this.telegramChatModel.findOne({ telegramChatId });
  }

  async getUserTelegramChats(userId: string) {
    return this.telegramChatModel.find({ userId }).sort({ lastActivityAt: -1 });
  }

  async getAssistantTelegramChats(assistantId: string) {
    return this.telegramChatModel
      .find({ assistantId })
      .sort({ lastActivityAt: -1 });
  }

  async handleTelegramWebhook(webhookData: any, botToken: string) {
    try {
      this.logger.log(
        "Received Telegram webhook:",
        JSON.stringify(webhookData, null, 2)
      );
      console.log(botToken);

      // Buscar el bot por token
      const bot = await this.findBotByToken(botToken);
      if (!bot) {
        this.logger.error(`No bot found for token`);
        return { success: false, error: "Bot not found" };
      }

      // Verificar si es un mensaje entrante
      if (webhookData.message) {
        const message = webhookData.message;
        const from = message.from;

        const telegramChatId = message.chat.id.toString();
        const telegramUserId = from.id.toString();
        const messageContent =
          message.text || message.caption || "Multimedia message";
        const messageId = message.message_id;
        const messageType = this.getTelegramMessageType(message);
        const username = from.username || "";
        const firstName = from.first_name || "";
        const lastName = from.last_name || "";

        // Crear o actualizar el chat usando la info del bot
        const chat = await this.createTelegramChat(
          bot.userId,
          bot.assistantId,
          telegramChatId,
          telegramUserId,
          messageContent,
          username,
          firstName,
          lastName,
          messageId
        );

        // Enviar respuesta a Telegram
        if (!chat) {
          return { error: "Failed to create or update chat" };
        }
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage.role === "assistant") {
          await this.sendTelegramMessage(
            bot.token,
            telegramChatId,
            lastMessage.content
          );
        }

        // Actualizar última actividad del bot
        await this.telegramBotModel.updateOne(
          { _id: bot._id },
          { lastActivityAt: new Date() }
        );

        return { success: true, chatId: chat._id };
      }

      return { success: true, message: "Webhook processed" };
    } catch (error) {
      this.logger.error("Error processing Telegram webhook:", error);
      return { success: false, error: error.message };
    }
  }

  private getTelegramMessageType(message: any): string {
    if (message.text) return "text";
    if (message.photo) return "photo";
    if (message.audio) return "audio";
    if (message.voice) return "voice";
    if (message.video) return "video";
    if (message.document) return "document";
    if (message.sticker) return "sticker";
    if (message.location) return "location";
    if (message.contact) return "contact";
    return "unknown";
  }

  // ==================== MÉTODOS PRIVADOS (copiados del ChatService) ====================

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
      }
    }

    const importantInfoFromAnalysis = this.extractImportantInfo(response);

    return {
      faqInfo,
      productosString,
      functionResults,
      funcionesEjecutadas,
      importantInfo: importantInfoFromAnalysis,
    };
  }

  private extractImportantInfo(response: string): string {
    const importantInfoMatch = response.match(/\[IMPORTANT_INFO:([^\]]+)\]/);
    return importantInfoMatch ? importantInfoMatch[1].trim() : "";
  }

  private cleanModelResponse(response: string): string {
    return response
      .replace(/\[FAQ:.*?\]/gi, "")
      .replace(/\[SEARCH:.*?\]/gi, "")
      .replace(/\[[A-Z_]+:.*?\]/gi, "")
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
    const finalImportantInfoContent =
      importantInfo && importantInfo !== "lo_que_necesita"
        ? importantInfo
        : "información general";

    return `[IMPORTANT_INFO: ${finalImportantInfoContent}${funcionesStr}]`;
  }

  private buildEnhancedMemoryContext(messages: any[]): string {
    const memoryParts: string[] = [];
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

  private async sendTelegramMessage(
    botToken: string,
    chatId: string,
    message: string
  ) {
    // Implementar envío de mensaje a Telegram Bot API
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });

      const result = await response.json();
      this.logger.log(`Telegram message sent to ${chatId}:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Error sending Telegram message:`, error);
      throw error;
    }
  }
}
