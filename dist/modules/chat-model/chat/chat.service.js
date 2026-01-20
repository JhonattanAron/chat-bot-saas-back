"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const chat_schema_1 = require("../schemas/chat.schema");
const prompt_generator_service_1 = require("../config/prompt-generator.service");
const predictions_service_1 = require("../model-ai/predictions.service");
const products_service_1 = require("../../products/products.service");
const users_service_1 = require("../../users/users.service");
const faqs_service_1 = require("../../faqs/faqs.service");
const custom_function_service_1 = require("../services/custom-function.service");
const mongoose_2 = require("@nestjs/mongoose");
const common_1 = require("@nestjs/common");
const predictionlargue_service_1 = require("../model-ai/predictionlargue.service");
let ChatService = class ChatService {
    constructor(chatModel, promptGen, predictionService, predictionLargeService, productSearchService, userService, faqsService, customFunctionService) {
        this.chatModel = chatModel;
        this.promptGen = promptGen;
        this.predictionService = predictionService;
        this.predictionLargeService = predictionLargeService;
        this.productSearchService = productSearchService;
        this.userService = userService;
        this.faqsService = faqsService;
        this.customFunctionService = customFunctionService;
    }
    async runAgentLoop(assistantId, userId, userMessage, memoryContext) {
        const context = await this.userService.getAssistantById(assistantId, userId);
        if (!context)
            throw new Error("Assistant not found");
        const availableFunctions = await this.customFunctionService.getFunctionsList(userId, assistantId);
        const firstPrompt = this.promptGen.generateUnifiedPrompt(context.name, context.description, memoryContext, userMessage, availableFunctions);
        const firstPrediction = await this.predictionService.predict(firstPrompt);
        let input_tokens = firstPrediction.input_tokens || 0;
        let output_tokens = firstPrediction.output_tokens || 0;
        const functionCall = this.customFunctionService.parseFunctionCall(firstPrediction.output);
        if (!functionCall) {
            return {
                response: firstPrediction.output,
                input_tokens,
                output_tokens,
            };
        }
        const functionResult = !["SEARCH", "FAQ", "IMPORTANT_INFO"].includes(functionCall.functionName)
            ? await this.customFunctionService.executeFunction(functionCall.functionName, functionCall.parameters, userId, assistantId)
            : null;
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
    async createChat(userId, assistantId, prompt) {
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
                    important_info: this.buildCompleteImportantInfo(importantInfo, result.funcionesEjecutadas || []),
                },
            ],
            lastActivityAt: new Date(),
            input_tokens: result.input_tokens,
            output_tokens: result.output_tokens,
        });
        return await chat.save();
    }
    async predict(userId, prompt) {
        let input_tokens = 0;
        let output_tokens = 0;
        const prediction = await this.predictionLargeService.predictLarge("", prompt);
        input_tokens = prediction.input_tokens || 0;
        output_tokens = prediction.output_tokens || 0;
        const messages = [
            {
                role: "user",
                content: prompt,
                createdAt: new Date(),
                important_info: "",
            },
            {
                role: "assistant",
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
    async singlePredict(userId, prompt) {
        let input_tokens = 0;
        let output_tokens = 0;
        const prediction = await this.predictionService.predict(prompt);
        input_tokens = prediction.input_tokens || 0;
        output_tokens = prediction.output_tokens || 0;
        const messages = [
            {
                role: "user",
                content: prompt,
                createdAt: new Date(),
                important_info: "",
            },
            {
                role: "assistant",
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
    async addMessage(chatId, assistantId, role, content) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            throw new Error("Chat not found");
        if (role !== "user")
            return chat;
        await this.chatModel.updateOne({ _id: chatId }, {
            $push: {
                messages: {
                    role: "user",
                    content,
                    createdAt: new Date(),
                    important_info: "",
                },
            },
        });
        const memoryContext = this.buildEnhancedMemoryContext(chat.messages);
        const result = await this.runAgentLoop(assistantId, chat.userId, content, memoryContext);
        const cleanedResponse = this.cleanModelResponse(result.response);
        const importantInfo = this.extractImportantInfo(result.response);
        await this.chatModel.updateOne({ _id: chatId }, {
            $push: {
                messages: {
                    role: "assistant",
                    content: cleanedResponse,
                    createdAt: new Date(),
                    important_info: this.buildCompleteImportantInfo(importantInfo, result.funcionesEjecutadas || []),
                },
            },
            $inc: {
                input_tokens: result.input_tokens,
                output_tokens: result.output_tokens,
            },
            $set: { lastActivityAt: new Date() },
        });
        return this.chatModel.findById(chatId);
    }
    async getChat(chatId) {
        return this.chatModel.findById(chatId);
    }
    async getUserChats(userId) {
        return this.chatModel.find({ userId }).sort({ lastActivityAt: -1 });
    }
    async processModelResponse(response, userId, assistantId) {
        let faqInfo = "";
        let productosString = "";
        const functionResults = [];
        const funcionesEjecutadas = [];
        const faqMatch = response.match(/\[FAQ:([^\]]+)\]/);
        if (faqMatch) {
            const faqQuery = faqMatch[1].trim();
            funcionesEjecutadas.push(`[FAQ:${faqQuery}]`);
            const faqResults = await this.faqsService.search(faqQuery, userId, assistantId);
            if (faqResults && faqResults.length > 0) {
                faqInfo = faqResults[0].answer;
            }
            else {
                faqInfo = "No se encontró información de FAQ para esa pregunta.";
            }
        }
        const searchMatch = response.match(/\[SEARCH:([^\]]+)\]/);
        if (searchMatch) {
            const searchTerm = searchMatch[1].trim();
            funcionesEjecutadas.push(`[SEARCH:${searchTerm}]`);
            const relatedProducts = await this.productSearchService.search(searchTerm, userId);
            if (relatedProducts.length === 0) {
                productosString = "No se encontraron productos con ese término.";
            }
            else {
                productosString = relatedProducts.map((p) => p.name).join(", ");
            }
        }
        const functionCall = this.customFunctionService.parseFunctionCall(response);
        if (functionCall) {
            if (!["SEARCH", "FAQ", "IMPORTANT_INFO"].includes(functionCall.functionName)) {
                const functionResult = await this.customFunctionService.executeFunction(functionCall.functionName, functionCall.parameters, userId, assistantId);
                functionResults.push(functionResult);
                funcionesEjecutadas.push(`[${functionCall.functionName}:${functionCall.parameters.join(", ")}]`);
            }
            else {
                console.log(`Skipping system function in custom function execution check: ${functionCall.functionName}`);
            }
        }
        else {
            console.log("No custom function call found in response");
        }
        const importantInfoFromAnalysis = this.extractImportantInfo(response);
        const result = {
            faqInfo,
            productosString,
            functionResults,
            funcionesEjecutadas,
            importantInfo: importantInfoFromAnalysis,
        };
        return result;
    }
    extractImportantInfo(response) {
        const importantInfoMatch = response.match(/\[IMPORTANT_INFO:([^\]]+)\]/);
        return importantInfoMatch ? importantInfoMatch[1].trim() : "";
    }
    cleanModelResponse(response) {
        return response
            .replace(/\[FAQ:.*?\]/gi, "")
            .replace(/\[SEARCH:.*?\]/gi, "")
            .replace(/\[[A-Z_]+:.*?\]/gi, "")
            .replace(/\[IMPORTANT_INFO:.*?\]/gi, "")
            .replace(/Respuesta:\s*/gi, "")
            .trim();
    }
    buildCompleteImportantInfo(importantInfo, funcionesEjecutadas) {
        const funcionesStr = funcionesEjecutadas.length
            ? ` [FUNCIONES_EJECUTADAS: ${funcionesEjecutadas.join(" ")}]`
            : "";
        const finalImportantInfoContent = importantInfo && importantInfo !== "lo_que_necesita"
            ? importantInfo
            : "información general";
        return `[IMPORTANT_INFO: ${finalImportantInfoContent}${funcionesStr}]`;
    }
    buildEnhancedMemoryContext(messages) {
        const memoryParts = [];
        const recentMessages = messages
            .filter((msg) => msg.role === "assistant" ||
            (msg.role === "user" && messages.indexOf(msg) > messages.length - 5))
            .slice(-4);
        for (let i = 0; i < recentMessages.length; i += 2) {
            const userMsg = recentMessages[i];
            const assistantMsg = recentMessages[i + 1];
            if (userMsg &&
                assistantMsg &&
                userMsg.role === "user" &&
                assistantMsg.role === "assistant") {
                const userContent = userMsg.content || "";
                const assistantImportantInfo = assistantMsg.important_info || "";
                let mainInfo = "";
                let functionsUsed = "";
                const mainInfoMatch = assistantImportantInfo.match(/\[IMPORTANT_INFO: ([^[]+)/);
                if (mainInfoMatch && mainInfoMatch[1].trim() !== "lo_que_necesita") {
                    mainInfo = mainInfoMatch[1].trim();
                }
                const functionsMatch = assistantImportantInfo.match(/\[FUNCIONES_EJECUTADAS: ([^\]]+)\]/);
                if (functionsMatch) {
                    functionsUsed = functionsMatch[1];
                }
                memoryParts.push(`Usuario preguntó: "${userContent}" | Asistente respondió sobre: ${mainInfo || "información general"} | Funciones usadas: ${functionsUsed || "ninguna"}`);
            }
        }
        return memoryParts.length > 0
            ? `CONVERSACIÓN PREVIA: ${memoryParts.join(" || ")}`
            : "";
    }
    async voiceChat(chatId, assistantId, audioBase64) {
        const asrPrompt = `Transcribe este audio a texto: ${audioBase64}`;
        const asrPrediction = await this.predictionService.predict(asrPrompt);
        const userText = asrPrediction.output || "";
        const chatAfterMessage = await this.addMessage(chatId, assistantId, "user", userText);
        if (!chatAfterMessage) {
            throw new Error(`Chat with chatId ${chatId} not found`);
        }
        const lastMessage = chatAfterMessage.messages[chatAfterMessage.messages.length - 1];
        const botText = lastMessage.content;
        const ttsPrompt = `Convierte este texto a audio en formato base64: ${botText}`;
        const ttsPrediction = await this.predictionService.predict(ttsPrompt);
        const audioResponseBase64 = ttsPrediction.output || "";
        return { audio: audioResponseBase64 };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(chat_schema_1.Chat.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        prompt_generator_service_1.PromptGeneratorService,
        predictions_service_1.PredictionService,
        predictionlargue_service_1.PredictionLargueService,
        products_service_1.ProductsService,
        users_service_1.UsersService,
        faqs_service_1.FaqsService,
        custom_function_service_1.CustomFunctionService])
], ChatService);
//# sourceMappingURL=chat.service.js.map