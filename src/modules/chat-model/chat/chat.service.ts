import { Model } from "mongoose";
import { Chat, type ChatDocument } from "../schemas/chat.schema";
import { PromptGeneratorService } from "../config/prompt-generator.service";
import { PredictionService } from "../model-ai/predictions.service";
import { ProductsService } from "src/modules/products/products.service";
import { FaqsService } from "src/modules/faqs/faqs.service";
import { CustomFunctionService } from "../services/custom-function.service";
import {
  FunctionRouterService,
  FunctionSchema,
} from "../model-ai/function-router.service";
import { MemoryManagerService } from "../model-ai/memory-manager.service";
import { AssistantChatsService } from "src/modules/assistant-chats/assistant-chats.service";

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
    private readonly assistantChatsService: AssistantChatsService,
    private readonly faqsService: FaqsService,
    private readonly customFunctionService: CustomFunctionService,
    private readonly functionRouter: FunctionRouterService,
    private readonly memoryManager: MemoryManagerService,
  ) {}

  /**
   * New optimized agent loop using Function Router + Memory Manager
   * Reduces tokens and improves performance
   */
  private async runOptimizedAgentLoop(
    assistantId: string,
    userId: string,
    userMessage: string,
    memoryContext: string,
  ) {
    const context = await this.assistantChatsService.getAssistantById(
      assistantId,
      userId,
    );
    if (!context) throw new Error("Assistant not found");

    // 1️⃣ Get available functions and convert to schemas
    const availableFunctions =
      await this.customFunctionService.getFunctionsList(userId, assistantId);
    const functionSchemas: FunctionSchema[] = availableFunctions.map((f) => ({
      name: f.name,
      description: f.description,
      category: f.type === "api" ? "api" : "custom",
      parameters: f.parameters || [],
      returnType: "any",
    }));

    // 2️⃣ Detect intent WITHOUT calling LLM (cost reduction)
    const intent = this.functionRouter.detectIntent(
      userMessage,
      functionSchemas,
    );

    // 3️⃣ If function call detected with high confidence, skip first prompt
    if (
      intent.intentType === "function_call" &&
      intent.confidence > 0.8 &&
      intent.functionName
    ) {
      console.log(
        "Function Router detected:",
        intent.functionName,
        intent.extractedParams,
      );

      // Execute function directly
      const functionResult = await this.customFunctionService.executeFunction(
        intent.functionName,
        intent.extractedParams || {},
        userId,
        assistantId,
      );

      // Generate response with function result
      const prompt = this.promptGen.generateOptimizedPrompt(
        context.name,
        context.description,
        userMessage,
        memoryContext,
        functionSchemas,
        "function_result",
        functionResult.result,
      );

      const prediction = await this.predictionService.predict(prompt);

      return {
        response: prediction.output,
        input_tokens: prediction.input_tokens || 0,
        output_tokens: prediction.output_tokens || 0,
        functionsEjecutadas: [
          `[${intent.functionName}:${JSON.stringify(intent.extractedParams)}]`,
        ],
      };
    }

    // 4️⃣ Standard agent loop for other cases
    const firstPrompt = this.promptGen.generateOptimizedPrompt(
      context.name,
      context.description,
      userMessage,
      memoryContext,
      functionSchemas,
      intent.intentType,
    );

    const firstPrediction = await this.predictionService.predict(firstPrompt);
    let input_tokens = firstPrediction.input_tokens || 0;
    let output_tokens = firstPrediction.output_tokens || 0;

    // Parse function call from response
    const functionCall = this.customFunctionService.parseFunctionCall(
      firstPrediction.output,
    );

    // No function needed - return direct response
    if (!functionCall) {
      return {
        response: firstPrediction.output,
        input_tokens,
        output_tokens,
      };
    }

    // Execute function
    const functionResult = await this.customFunctionService.executeFunction(
      functionCall.functionName,
      functionCall.parameters,
      userId,
      assistantId,
    );

    // Generate final response
    const secondPrompt = this.promptGen.generateOptimizedPrompt(
      context.name,
      context.description,
      userMessage,
      memoryContext,
      functionSchemas,
      "function_result",
      functionResult.result,
    );

    const secondPrediction = await this.predictionService.predict(secondPrompt);
    input_tokens += secondPrediction.input_tokens || 0;
    output_tokens += secondPrediction.output_tokens || 0;

    return {
      response: secondPrediction.output,
      input_tokens,
      output_tokens,
      functionsEjecutadas: functionResult.success
        ? [
            `[${functionCall.functionName}:${JSON.stringify(functionCall.parameters)}]`,
          ]
        : [],
    };
  }

  async createChat(
    userId: string,
    assistantId: string,
    prompt: string,
  ): Promise<ChatDocument> {
    const result = await this.runOptimizedAgentLoop(
      assistantId,
      userId,
      prompt,
      "",
    );

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
            result.functionsEjecutadas || [],
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

    const prediction = await this.predictionLargeService.predictLarge(
      "",
      prompt,
    );

    input_tokens = prediction.input_tokens || 0;
    output_tokens = prediction.output_tokens || 0;

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

    const chat = new this.chatModel({
      userId,
      messages,
      lastActivityAt: new Date(),
      input_tokens,
      output_tokens,
    });

    return await chat.save();
  }

  async singlePredict(userId: string, prompt: string): Promise<ChatDocument> {
    let input_tokens = 0;
    let output_tokens = 0;

    const prediction = await this.predictionService.predict(prompt);

    input_tokens = prediction.input_tokens || 0;
    output_tokens = prediction.output_tokens || 0;

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

    const chat = new this.chatModel({
      userId,
      messages,
      lastActivityAt: new Date(),
      input_tokens,
      output_tokens,
    });

    return await chat.save();
  }

  async addMessage(
    chatId: string,
    assistantId: string,
    role: "user" | "assistant",
    content: string,
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
      },
    );

    // Use memory manager for efficient context building
    const memoryContext = this.memoryManager.buildEnhancedMemoryContext(
      chat.messages,
      6,
    );

    const result = await this.runOptimizedAgentLoop(
      assistantId,
      chat.userId,
      content,
      memoryContext,
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
              result.functionsEjecutadas || [],
            ),
          },
        },
        $inc: {
          input_tokens: result.input_tokens,
          output_tokens: result.output_tokens,
        },
        $set: { lastActivityAt: new Date() },
      },
    );

    return this.chatModel.findById(chatId);
  }

  async getChat(chatId: string) {
    return this.chatModel.findById(chatId);
  }

  async getUserChats(userId: string) {
    return this.chatModel.find({ userId }).sort({ lastActivityAt: -1 });
  }

  // ==================== UTILITY METHODS ====================

  private extractImportantInfo(response: string): string {
    // Check both JSON format and tag format
    const jsonMatch = response.match(/"important_info":\s*"([^"]+)"/i);
    if (jsonMatch) return jsonMatch[1];

    const tagMatch = response.match(/\[IMPORTANT_INFO:([^\]]+)\]/);
    return tagMatch ? tagMatch[1].trim() : "";
  }

  private cleanModelResponse(response: string): string {
    // Remove all known tags and JSON formatting
    return response
      .replace(/```json[\s\S]*?```/g, "")
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

  async voiceChat(
    chatId: string,
    assistantId: string,
    audioBase64: string,
  ): Promise<{ audio: string }> {
    // 1️⃣ Transcribe audio
    const asrPrompt = `Transcribe este audio a texto: ${audioBase64}`;
    const asrPrediction = await this.predictionService.predict(asrPrompt);
    const userText = asrPrediction.output || "";

    // 2️⃣ Process conversation
    const chatAfterMessage = await this.addMessage(
      chatId,
      assistantId,
      "user",
      userText,
    );

    if (!chatAfterMessage) {
      throw new Error(`Chat with chatId ${chatId} not found`);
    }

    // 3️⃣ Get bot response
    const lastMessage =
      chatAfterMessage.messages[chatAfterMessage.messages.length - 1];
    const botText = lastMessage.content;

    // 4️⃣ Convert to audio
    const ttsPrompt = `Convierte este texto a audio en formato base64: ${botText}`;
    const ttsPrediction = await this.predictionService.predict(ttsPrompt);
    const audioResponseBase64 = ttsPrediction.output || "";

    return { audio: audioResponseBase64 };
  }
}
