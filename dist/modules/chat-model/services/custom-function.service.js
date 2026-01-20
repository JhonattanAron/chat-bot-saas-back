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
var CustomFunctionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFunctionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const assistant_chat_schema_1 = require("../../users/schemas/assistant-chat.schema");
let CustomFunctionService = CustomFunctionService_1 = class CustomFunctionService {
    constructor(assistantChatModel) {
        this.assistantChatModel = assistantChatModel;
        this.logger = new common_1.Logger(CustomFunctionService_1.name);
    }
    async executeFunction(functionName, parameters, userId, assistantId) {
        try {
            this.logger.log(`Executing function: ${functionName} with params: ${parameters.join(", ")}`);
            const assistant = await this.assistantChatModel.findOne({
                _id: assistantId,
                user_id: userId,
            });
            if (!assistant) {
                this.logger.error(`Assistant not found for userId: ${userId}, assistantId: ${assistantId}`);
                return {
                    success: false,
                    error: "Assistant not found",
                    result: null,
                    executedFunction: functionName,
                };
            }
            this.logger.log(`Found assistant with ${assistant.funciones?.length || 0} functions`);
            if (!assistant.funciones || assistant.funciones.length === 0) {
                this.logger.warn(`No functions found for assistant ${assistantId}`);
                return {
                    success: false,
                    error: "No functions available for this assistant",
                    result: null,
                    executedFunction: functionName,
                };
            }
            assistant.funciones.forEach((func, index) => {
                this.logger.log(`Function ${index}: name="${func?.name}", type="${func?.type}"`);
            });
            const functionDef = assistant.funciones.find((func) => {
                if (!func || !func.name) {
                    this.logger.warn(`Found function with undefined name at index`);
                    return false;
                }
                return func.name.toUpperCase() === functionName.toUpperCase();
            });
            if (!functionDef) {
                this.logger.error(`Function ${functionName} not found. Available functions: ${assistant.funciones.map((f) => f?.name || "undefined").join(", ")}`);
                return {
                    success: false,
                    error: `Function ${functionName} not found. Available functions: ${assistant.funciones.map((f) => f?.name || "undefined").join(", ")}`,
                    result: null,
                    executedFunction: functionName,
                };
            }
            this.logger.log(`Found function definition:`, {
                name: functionDef.name,
                type: functionDef.type,
                hasApi: !!functionDef.api,
                hasCode: !!functionDef.code,
            });
            if (functionDef.type === "api") {
                return await this.executeApiFunction(functionDef, parameters);
            }
            else if (functionDef.type === "custom") {
                return await this.executeCustomFunction(functionDef, parameters);
            }
            else {
                return {
                    success: false,
                    error: `Unsupported function type: ${functionDef.type}`,
                    result: null,
                    executedFunction: functionName,
                };
            }
        }
        catch (error) {
            this.logger.error(`Error executing function ${functionName}:`, error);
            return {
                success: false,
                error: error.message,
                result: null,
                executedFunction: functionName,
            };
        }
    }
    async executeApiFunction(functionDef, parameters) {
        try {
            const { api } = functionDef;
            if (!api || !api.url) {
                return {
                    success: false,
                    error: "API configuration is missing",
                    result: null,
                    executedFunction: functionDef.name,
                };
            }
            const headers = {
                "Content-Type": "application/json",
            };
            if (api.headers && Array.isArray(api.headers)) {
                api.headers.forEach((header) => {
                    if (header && header.key && header.value) {
                        headers[header.key] = header.value;
                    }
                });
            }
            let requestUrl = api.url;
            let requestBody;
            if (api.method.toUpperCase() === "GET") {
                const queryParams = new URLSearchParams();
                if (api.parameters &&
                    Array.isArray(api.parameters) &&
                    parameters.length > 0) {
                    api.parameters.forEach((param, index) => {
                        if (param && param.name && index < parameters.length) {
                            queryParams.append(param.name, parameters[index].trim());
                        }
                    });
                }
                const queryString = queryParams.toString();
                if (queryString) {
                    requestUrl = `${api.url}?${queryString}`;
                }
            }
            else {
                const body = {};
                if (api.parameters &&
                    Array.isArray(api.parameters) &&
                    parameters.length > 0) {
                    api.parameters.forEach((param, index) => {
                        if (param && param.name && index < parameters.length) {
                            body[param.name] = parameters[index].trim();
                        }
                    });
                }
                requestBody = JSON.stringify(body);
            }
            this.logger.log(`Making API call to: ${requestUrl}`);
            this.logger.log(`Method: ${api.method}`);
            this.logger.log(`Headers:`, headers);
            if (requestBody) {
                this.logger.log(`Body:`, requestBody);
            }
            const response = await fetch(requestUrl, {
                method: api.method.toUpperCase(),
                headers,
                body: requestBody,
            });
            let responseData;
            try {
                responseData = await response.json();
            }
            catch {
                responseData = await response.text();
            }
            if (!response.ok) {
                return {
                    success: false,
                    error: `API call failed: ${response.status} ${response.statusText}`,
                    result: responseData,
                    executedFunction: functionDef.name,
                };
            }
            return {
                success: true,
                result: responseData,
                executedFunction: functionDef.name,
            };
        }
        catch (error) {
            this.logger.error(`Error in API function execution:`, error);
            return {
                success: false,
                error: error.message,
                result: null,
                executedFunction: functionDef.name,
            };
        }
    }
    async executeCustomFunction(functionDef, parameters) {
        try {
            this.logger.log(`Executing custom function: ${functionDef.name}`);
            this.logger.log(`Code: ${functionDef.code}`);
            this.logger.log(`Parameters: ${parameters.join(", ")}`);
            const result = {
                message: `Custom function ${functionDef.name} executed successfully`,
                parameters: parameters,
                timestamp: new Date().toISOString(),
                code: functionDef.code,
            };
            return {
                success: true,
                result,
                executedFunction: functionDef.name,
            };
        }
        catch (error) {
            this.logger.error(`Error in custom function execution:`, error);
            return {
                success: false,
                error: error.message,
                result: null,
                executedFunction: functionDef.name,
            };
        }
    }
    async getFunctionsList(userId, assistantId) {
        try {
            const assistant = await this.assistantChatModel.findOne({
                _id: assistantId,
                user_id: userId,
            });
            if (!assistant || !assistant.funciones) {
                this.logger.warn(`No assistant or functions found for userId: ${userId}, assistantId: ${assistantId}`);
                return [];
            }
            return assistant.funciones
                .filter((func) => func && func.name && func.type)
                .map((func) => ({
                name: func.name,
                description: func.description || "",
                type: func.type,
                parameters: func.api?.parameters || [],
            }));
        }
        catch (error) {
            this.logger.error(`Error getting functions list:`, error);
            return [];
        }
    }
    parseFunctionCall(text) {
        const functionMatch = text.match(/\[([A-Z_]+):([^\]]+)\]/);
        if (!functionMatch) {
            return null;
        }
        const functionName = functionMatch[1];
        const parametersString = functionMatch[2];
        const parameters = parametersString.split(",").map((param) => param.trim());
        this.logger.log(`Parsed function call: ${functionName} with parameters: [${parameters.join(", ")}]`);
        return {
            functionName,
            parameters,
        };
    }
};
exports.CustomFunctionService = CustomFunctionService;
exports.CustomFunctionService = CustomFunctionService = CustomFunctionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(assistant_chat_schema_1.AssistantChat.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CustomFunctionService);
//# sourceMappingURL=custom-function.service.js.map