import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { Chat, ChatDocument } from "../schemas/chat.schema";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import { UsersService } from "src/modules/users/users.service";

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private promptGen: PromptGeneratorService,
    private readonly predictionService: PredictionService,
    private readonly productSearchService: ProductsService,
    private readonly userService: UsersService
  ) {}

  async createChat(userId: string, promt: string): Promise<ChatDocument> {
    let input_tokens = 0;
    let output_tokens = 0;
    const context = await this.userService.getAssistantChatByUserId(userId);

    if (!context) {
      throw new Error(`No context found for userId ${userId}`);
    }

    // Prompt inicial
    const prompt = this.promptGen.generateInitialPromt(
      context.name,
      context.description,
      "",
      promt
    );

    // Primera predicción
    const prediction = await this.predictionService.predict(prompt);
    const firstResponse = prediction.output;
    input_tokens = input_tokens + prediction.input_tokens;
    output_tokens = output_tokens + prediction.output_tokens;
    // Buscar INFO y SEARCH
    const infoMatch = firstResponse.match(/\[INFO:([^\]]+)\]/);
    const importantInfo = infoMatch ? infoMatch[1].trim() : "";

    const searchMatch = firstResponse.match(/\[SEARCH:(.*?)\]/i);

    let finalMessage = firstResponse;

    // Si hay un SEARCH
    if (searchMatch) {
      const searchTerm = searchMatch[1].trim();
      const relatedProducts = await this.productSearchService.search(
        searchTerm,
        userId
      );

      let productosString: string;
      if (relatedProducts.length === 0) {
        productosString = "No se encontraron productos con ese término.";
      } else {
        productosString = relatedProducts.map((p) => p.name).join(", ");
      }

      // 🔁 Generar segundo prompt con productos encontrados
      const secondPrompt = this.promptGen.generateMessagePromt(
        importantInfo,
        "",
        productosString,
        "",
        promt
      );

      // Segunda predicción ya con info útil
      const secondResponse = await this.predictionService.predict(secondPrompt);
      input_tokens = input_tokens + prediction.input_tokens;
      output_tokens = output_tokens + prediction.output_tokens;
      finalMessage = secondResponse.output;
    }

    // Guardar el chat con la mejor respuesta generada
    const chat = new this.chatModel({
      userId,
      chatId: new Types.ObjectId().toHexString(),
      prompt,
      messages: [
        {
          role: "assistant",
          content: finalMessage,
          createdAt: new Date(),
        },
      ],
      lastActivityAt: new Date(),
    });

    return chat.save();
  }

  private async extractAndSearchProducts(response: string, userId: string) {
    const match = response.match(/\[SEARCH:(.*?)\]/i);
    if (!match) return null;
    const searchTerm = match[1].trim();
    return this.productSearchService.search(searchTerm, userId);
  }

  async addMessage(
    chatId: string,
    role: "user" | "assistant",
    content: string
  ) {
    const chat = await this.chatModel.findOneAndUpdate(
      { chatId },
      {
        $push: { messages: { role, content, createdAt: new Date() } },
        $set: { lastActivityAt: new Date() },
      },
      { new: true }
    );

    if (!chat) throw new Error(`Chat with chatId ${chatId} not found`);

    if (role === "user") {
      const firstPrompt = `Usuario: ${content}\nAsistente:`;
      const predict = await this.predictionService.predict(firstPrompt);
      const firstResponse = predict.output;
      const infoMatch = firstResponse.match(/\[INFO:([^\]]+)\]/);
      const importantInfo = infoMatch ? infoMatch[1].trim() : "";

      await this.chatModel.findOneAndUpdate(
        { chatId },
        {
          $push: {
            messages: {
              role: "assistant",
              content: firstResponse,
              createdAt: new Date(),
              important_info: importantInfo || undefined,
            },
          },
          $set: { lastActivityAt: new Date() },
        }
      );

      const relatedProducts = await this.extractAndSearchProducts(
        firstResponse,
        chat.userId
      );

      if (relatedProducts?.length) {
        const productosString = relatedProducts.map((p) => p.name).join(", ");
        const secondPrompt = this.promptGen.generateMessagePromt(
          `[INFO: ${importantInfo}]`,
          "", // funciones
          productosString,
          "", // car
          content
        );

        const secondResponse =
          await this.predictionService.predict(secondPrompt);

        await this.chatModel.findOneAndUpdate(
          { chatId },
          {
            $push: {
              messages: {
                role: "assistant",
                content:
                  secondResponse +
                  `\n\nProductos encontrados: ${productosString}`,
                createdAt: new Date(),
                important_info: importantInfo || undefined,
              },
            },
            $set: { lastActivityAt: new Date() },
          }
        );
      }
    }

    return this.chatModel.findOne({ chatId });
  }

  async getChat(chatId: string) {
    return this.chatModel.findOne({ chatId });
  }
}
