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
    private readonly customFunctionService: CustomFunctionService,
  ) {}

  async connectBot(
    token: string,
    userId: string,
    assistantId: string,
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
        `Bot connected: ${webhook} ${botInfo.username} (${botInfo.id})`,
      );
      return savedBot;
    } catch (error) {
      this.logger.error("Error connecting bot:", error);
      throw error;
    }
  }
  private async runTelegramAgent(
    userId: string,
    assistantId: string,
    userMessage: string,
    memoryContext: string,
  ) {
    const context = await this.userService.getAssistantById(
      assistantId,
      userId,
    );
    if (!context) throw new Error("Assistant not found");

    const availableFunctions =
      await this.customFunctionService.getFunctionsList(userId, assistantId);

    /** ========= PRIMER PROMPT ========= */
    const firstPrompt = this.promptGen.generateUnifiedPrompt(
      context.name,
      context.description,
      memoryContext,
      userMessage,
      availableFunctions,
    );

    const firstPrediction = await this.predictionService.predict(firstPrompt);

    let input_tokens = firstPrediction.input_tokens || 0;
    let output_tokens = firstPrediction.output_tokens || 0;

    const functionCall = this.customFunctionService.parseFunctionCall(
      firstPrediction.output,
    );

    /** ========= RESPUESTA NORMAL ========= */
    if (!functionCall) {
      return {
        response: firstPrediction.output,
        input_tokens,
        output_tokens,
      };
    }

    /** ========= EJECUCIÓN DE FUNCIÓN ========= */
    let functionResult: any;
    let responseToUser = ""; // Lo que se enviará al chat

    try {
      const functionName = functionCall.functionName;

      if (functionName === "IMPORTANT_INFO") {
        // Para IMPORTANT_INFO solo registramos pero también mostramos al usuario
        functionResult = {
          name: functionName,
          parameters: functionCall.parameters,
        };
        responseToUser = functionCall.parameters.join(" ");
      } else {
        // Funciones normales
        const apiResult = await this.customFunctionService.executeFunction(
          functionName,
          functionCall.parameters,
          userId,
          assistantId,
        );

        functionResult = {
          name: functionName,
          parameters: functionCall.parameters,
          result: apiResult,
        };
        responseToUser =
          typeof apiResult === "string" ? apiResult : JSON.stringify(apiResult);
      }
    } catch (err: any) {
      functionResult = {
        name: functionCall.functionName,
        parameters: functionCall.parameters,
        error: {
          message: err?.message || "Error desconocido",
          stack: err?.stack || "",
        },
      };
      responseToUser = "❌ Ocurrió un error al ejecutar la función.";
    }

    /** ========= SEGUNDO PROMPT (CON RESULTADO O ERROR) ========= */
    const secondPrompt = this.promptGen.generateUnifiedPrompt(
      context.name,
      context.description,
      memoryContext,
      userMessage,
      availableFunctions,
      [functionResult],
    );

    const secondPrediction = await this.predictionService.predict(secondPrompt);

    input_tokens += secondPrediction.input_tokens || 0;
    output_tokens += secondPrediction.output_tokens || 0;

    return {
      response: responseToUser || secondPrediction.output,
      input_tokens,
      output_tokens,
      funcionesEjecutadas: [
        `[${functionCall.functionName}:${functionCall.parameters.join(", ")}]`,
      ],
    };
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
    message: string,
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
    token: string,
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
    messageId?: number,
  ) {
    const existingChat = await this.telegramChatModel.findOne({
      telegramChatId,
    });

    if (existingChat) {
      return this.addTelegramMessage(
        (existingChat._id as Types.ObjectId).toString(),
        assistantId,
        "user",
        message,
        messageId,
      );
    }

    const result = await this.runTelegramAgent(
      userId,
      assistantId,
      message,
      "",
    );

    const cleanedResponse = this.cleanModelResponse(result.response);
    const importantInfo = this.extractImportantInfo(result.response);

    const chat = new this.telegramChatModel({
      userId,
      assistantId,
      telegramChatId,
      telegramUserId,
      username: username || "",
      firstName: firstName || "",
      lastName: lastName || "",
      messages: [
        {
          role: "user",
          content: message,
          createdAt: new Date(),
          messageId,
          messageType: "text",
        },
        {
          role: "assistant",
          content: cleanedResponse,
          createdAt: new Date(),
          important_info: this.buildCompleteImportantInfo(
            importantInfo,
            result.funcionesEjecutadas || [],
          ),
          messageType: "text",
        },
      ],
      input_tokens: result.input_tokens,
      output_tokens: result.output_tokens,
      lastActivityAt: new Date(),
    });

    return chat.save();
  }

  async addTelegramMessage(
    chatId: string,
    assistantId: string,
    role: "user" | "assistant",
    content: string,
    messageId?: number,
  ) {
    const chat = await this.telegramChatModel.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    if (role !== "user") return chat;

    await this.telegramChatModel.updateOne(
      { _id: chatId },
      {
        $push: {
          messages: {
            role: "user",
            content,
            createdAt: new Date(),
            messageId,
            messageType: "text",
          },
        },
        $set: { lastActivityAt: new Date() },
      },
    );

    const memoryContext = this.buildEnhancedMemoryContext(chat.messages);

    const result = await this.runTelegramAgent(
      chat.userId,
      assistantId,
      content,
      memoryContext,
    );

    const cleanedResponse = this.cleanModelResponse(result.response);
    const importantInfo = this.extractImportantInfo(result.response);

    await this.telegramChatModel.updateOne(
      { _id: chatId },
      {
        $push: {
          messages: {
            role: "assistant",
            content: cleanedResponse,
            createdAt: new Date(),
            important_info: this.buildCompleteImportantInfo(
              importantInfo,
              result.funcionesEjecutadas || [],
            ),
            messageType: "text",
          },
        },
        $inc: {
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
        },
      },
    );

    return this.telegramChatModel.findById(chatId);
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
    let telegramChatId: string | undefined;

    try {
      const bot = await this.findBotByToken(botToken);
      if (!bot) return { success: false };

      if (!webhookData.message) return { success: true };

      const message = webhookData.message;
      const from = message.from;

      telegramChatId = message.chat.id.toString();
      const telegramUserId = from.id.toString();
      const messageContent =
        message.text || message.caption || "Mensaje no soportado";
      const messageId = message.message_id;
      const username = from.username || "";
      const firstName = from.first_name || "";
      const lastName = from.last_name || "";

      let responseText: string | null = null;

      try {
        if (!telegramChatId) return { success: false };

        const chat = await this.createTelegramChat(
          bot.userId,
          bot.assistantId,
          telegramChatId,
          telegramUserId,
          messageContent,
          username,
          firstName,
          lastName,
          messageId,
        );

        if (chat?.messages?.length) {
          const lastMessage = chat.messages.at(-1);
          if (lastMessage?.role === "assistant" && lastMessage.content) {
            responseText = lastMessage.content;
          }
        }
      } catch (agentError: any) {
        this.logger.error("AI agent error → enviando al modelo", agentError);

        const errorPrompt = `
Eres un asistente que debe explicar errores de forma clara al usuario.

MENSAJE DEL USUARIO:
"${messageContent}"

ERROR DETECTADO:
${agentError?.message || "Error desconocido"}

INSTRUCCIONES:
- Explica qué ocurrió
- No digas que la conversación se reinició
- Sugiere cómo continuar
`;

        const errorPrediction =
          await this.predictionService.predict(errorPrompt);
        responseText =
          errorPrediction?.output ||
          "Ocurrió un problema interno, puedes intentar nuevamente.";
      }

      if (telegramChatId && responseText) {
        await this.sendTelegramMessage(bot.token, telegramChatId, responseText);
      }

      await this.telegramBotModel.updateOne(
        { _id: bot._id },
        { lastActivityAt: new Date() },
      );

      return { success: true };
    } catch (fatalError) {
      this.logger.error("Fatal webhook error:", fatalError);
      if (telegramChatId) {
        await this.deleteTelegramChatByTelegramId(telegramChatId);
      }
      return { success: false };
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
    assistantId: string,
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
        assistantId,
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
        userId,
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
          assistantId,
        );
        functionResults.push(functionResult);
        funcionesEjecutadas.push(
          `[${functionCall.functionName}:${functionCall.parameters.join(", ")}]`,
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
    funcionesEjecutadas: string[],
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
          (msg.role === "user" && messages.indexOf(msg) > messages.length - 5),
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
          /\[IMPORTANT_INFO: ([^[]+)/,
        );
        if (mainInfoMatch && mainInfoMatch[1].trim() !== "lo_que_necesita") {
          mainInfo = mainInfoMatch[1].trim();
        }

        const functionsMatch = assistantImportantInfo.match(
          /\[FUNCIONES_EJECUTADAS: ([^\]]+)\]/,
        );
        if (functionsMatch) {
          functionsUsed = functionsMatch[1];
        }

        memoryParts.push(
          `Usuario preguntó: "${userContent}" | Asistente respondió sobre: ${mainInfo || "información general"} | Funciones usadas: ${functionsUsed || "ninguna"}`,
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
    message: string,
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

  private async deleteTelegramChatByTelegramId(telegramChatId: string) {
    try {
      await this.telegramChatModel.deleteOne({ telegramChatId });
      this.logger.warn(
        `Telegram chat ${telegramChatId} eliminado por error crítico`,
      );
    } catch (err) {
      this.logger.error(`Error eliminando chat ${telegramChatId}:`, err);
    }
  }
}
