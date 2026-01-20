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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const create_asistantdto_1 = require("./schemas/create-asistantdto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    createAssistantChat(body) {
        return this.usersService.createAssistantChatData(body);
    }
    async getAllAssistantChats(user_id) {
        return this.usersService.getAllAssistantChatsByUserId(user_id);
    }
    async getAssistantChat(id, user_id) {
        return this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(id, user_id);
    }
    async addFunction(body) {
        try {
            const { user_id, assistant_id, function: newFunction } = body;
            const assistant = await this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(assistant_id, user_id);
            if (!assistant) {
                return {
                    success: false,
                    error: "Assistant not found",
                };
            }
            const existingFunction = assistant.funciones?.find((f) => f.name.toUpperCase() === newFunction.name.toUpperCase());
            if (existingFunction) {
                return {
                    success: false,
                    error: `Function with name '${newFunction.name}' already exists`,
                };
            }
            const updatedAssistant = await this.usersService.addFunctionToAssistant(assistant_id, user_id, newFunction);
            const newFunctionId = updatedAssistant.funciones[updatedAssistant.funciones.length - 1]?._id?.toString();
            return {
                success: true,
                message: "Función agregada exitosamente",
                function_name: newFunction.name,
                assistant_id,
                total_functions: updatedAssistant.funciones.length,
                function_id: newFunctionId,
            };
        }
        catch (error) {
            console.error("Error adding function:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getFunctions(user_id, assistant_id) {
        try {
            if (!user_id || !assistant_id) {
                return {
                    success: false,
                    error: "Missing required parameters: user_id and assistant_id are required",
                };
            }
            const assistant = await this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(assistant_id, user_id);
            if (!assistant) {
                return {
                    success: false,
                    error: "Assistant not found",
                };
            }
            const formattedFunctions = assistant.funciones?.map((func) => ({
                id: func._id?.toString(),
                name: func.name,
                description: func.description,
                type: func.type,
                api: func.api
                    ? {
                        url: func.api.url,
                        method: func.api.method,
                        headers: func.api.headers || [],
                        parameters: func.api.parameters || [],
                        auth: func.api.auth,
                    }
                    : undefined,
                code: func.code,
                credentials: func.credentials || [],
                hasCode: !!func.code,
                hasApi: !!func.api,
            })) || [];
            return {
                success: true,
                assistant_id,
                assistant_name: assistant.name,
                total_functions: formattedFunctions.length,
                functions: formattedFunctions,
            };
        }
        catch (error) {
            console.error("Error getting functions:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async updateFunction(functionId, body) {
        try {
            const { user_id, assistant_id, function: updateData } = body;
            const updatedAssistant = await this.usersService.updateFunction(assistant_id, user_id, functionId, updateData);
            if (!updatedAssistant) {
                return {
                    success: false,
                    error: "Function or Assistant not found",
                };
            }
            const updatedFunction = updatedAssistant.funciones?.find((f) => f._id?.toString() === functionId);
            return {
                success: true,
                message: "Función actualizada exitosamente",
                function_id: functionId,
                function_name: updatedFunction?.name,
                assistant_id,
            };
        }
        catch (error) {
            console.error("Error updating function:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async deleteFunction(functionId, user_id, assistant_id) {
        try {
            const updatedAssistant = await this.usersService.deleteFunction(assistant_id, user_id, functionId);
            if (!updatedAssistant) {
                return {
                    success: false,
                    error: "Function or Assistant not found",
                };
            }
            return {
                success: true,
                message: "Función eliminada exitosamente",
                function_id: functionId,
                assistant_id,
                remaining_functions: updatedAssistant.funciones.length,
            };
        }
        catch (error) {
            console.error("Error deleting function:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async createSampleFunctions(body) {
        try {
            const sampleAssistant = {
                user_id: body.user_id,
                name: "Asistente con Funciones",
                description: "Asistente que puede ejecutar funciones personalizadas como enviar correos y procesar datos",
                status: "active",
                type: "custom",
                use_case: "automation",
                welcome_message: "¡Hola! Puedo ayudarte a ejecutar funciones personalizadas como enviar correos.",
                funciones: [
                    {
                        name: "ENVIAR_CORREO",
                        description: "Envía un correo electrónico a una dirección específica",
                        type: "api",
                        api: {
                            url: "https://httpbin.org/post",
                            method: "POST",
                            headers: [
                                { key: "Authorization", value: "Bearer test-token" },
                                { key: "Content-Type", value: "application/json" },
                            ],
                            parameters: [
                                {
                                    name: "email",
                                    type: "string",
                                    required: true,
                                    description: "Email del destinatario",
                                },
                                {
                                    name: "subject",
                                    type: "string",
                                    required: true,
                                    description: "Asunto del correo",
                                },
                                {
                                    name: "message",
                                    type: "string",
                                    required: true,
                                    description: "Mensaje del correo",
                                },
                            ],
                        },
                    },
                    {
                        name: "PROCESAR_DATOS",
                        description: "Procesa datos personalizados usando código JavaScript",
                        type: "custom",
                        code: "console.log('Procesando datos:', parameters); return { processed: true, data: parameters, timestamp: new Date() };",
                    },
                ],
            };
            const result = await this.usersService.createAssistantChatData(sampleAssistant);
            return {
                success: true,
                message: "Asistente creado exitosamente con funciones de ejemplo",
                assistant_id: result._id?.toString(),
                user_id: body.user_id,
                funciones_disponibles: result.funciones.map((f) => `${f.name} - ${f.description}`),
                next_steps: [
                    `POST /chat/start con assistant_id: ${result._id}`,
                    "Prueba: 'envía un correo a test@email.com con asunto Hola y mensaje Test'",
                    "Prueba: 'procesa estos datos: usuario, 123, activo'",
                ],
            };
        }
        catch (error) {
            console.error("Error creating sample functions:", error);
            return {
                success: false,
                error: error.message,
                details: error,
            };
        }
    }
    async testEndpoint(body) {
        return {
            success: true,
            message: "Users controller is working",
            received_body: body,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)("assistant-chat"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_asistantdto_1.CreateAssistantDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createAssistantChat", null);
__decorate([
    (0, common_1.Get)("assistant-chats"),
    __param(0, (0, common_1.Query)("user_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllAssistantChats", null);
__decorate([
    (0, common_1.Get)("assistant-chat"),
    __param(0, (0, common_1.Query)("id")),
    __param(1, (0, common_1.Query)("user_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAssistantChat", null);
__decorate([
    (0, common_1.Post)("functions"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addFunction", null);
__decorate([
    (0, common_1.Get)("functions"),
    __param(0, (0, common_1.Query)("user_id")),
    __param(1, (0, common_1.Query)("assistant_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFunctions", null);
__decorate([
    (0, common_1.Put)("functions/:functionId"),
    __param(0, (0, common_1.Param)("functionId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateFunction", null);
__decorate([
    (0, common_1.Delete)("functions/:functionId"),
    __param(0, (0, common_1.Param)("functionId")),
    __param(1, (0, common_1.Query)("user_id")),
    __param(2, (0, common_1.Query)("assistant_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteFunction", null);
__decorate([
    (0, common_1.Post)("create-sample-functions"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createSampleFunctions", null);
__decorate([
    (0, common_1.Post)("test"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "testEndpoint", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("users"),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map