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
exports.ApiKeyValidateController = void 0;
const common_1 = require("@nestjs/common");
const api_key_validate_service_1 = require("./api-key-validate.service");
let ApiKeyValidateController = class ApiKeyValidateController {
    constructor(apiKeyValidateService) {
        this.apiKeyValidateService = apiKeyValidateService;
    }
    async createApiKey(body) {
        if (!body.name || !body.user_id) {
            throw new common_1.BadRequestException("Name is required");
        }
        const apiKey = await this.apiKeyValidateService.createApiKey(body.name, body.user_id);
        return {
            message: "API Key created successfully",
            apiKey: {
                id: apiKey._id,
                name: apiKey.name,
                key: apiKey.key,
            },
        };
    }
    async updateApiKey(id, body) {
        if (!body.name) {
            throw new common_1.BadRequestException("Name is required");
        }
        const updatedApiKey = await this.apiKeyValidateService.updateApiKey(id, body.name);
        if (!updatedApiKey) {
            throw new common_1.NotFoundException("API Key not found");
        }
        return {
            message: "API Key updated successfully",
            apiKey: {
                id: updatedApiKey._id,
                name: updatedApiKey.name,
            },
        };
    }
    async deleteApiKey(id) {
        const result = await this.apiKeyValidateService.deleteApiKey(id);
        if (!result || result.deletedCount === 0) {
            throw new common_1.NotFoundException("API Key not found");
        }
        return {
            message: "API Key deleted successfully",
        };
    }
    async getAllApiKeys() {
        const apiKeys = await this.apiKeyValidateService.findAllApiKeys();
        return { apiKeys };
    }
    async validateClientKey(body) {
        if (!body.clientKey) {
            throw new common_1.BadRequestException("clientKey is required.");
        }
        const isValid = await this.apiKeyValidateService.validateClientKey(body.clientKey);
        if (!isValid) {
            return {
                success: false,
                message: "Invalid client key or unauthorized.",
            };
        }
        return {
            success: true,
            message: "Client key validated successfully.",
        };
    }
};
exports.ApiKeyValidateController = ApiKeyValidateController;
__decorate([
    (0, common_1.Post)("api-keys"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeyValidateController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Put)("api-keys/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyValidateController.prototype, "updateApiKey", null);
__decorate([
    (0, common_1.Delete)("api-keys/:id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiKeyValidateController.prototype, "deleteApiKey", null);
__decorate([
    (0, common_1.Get)("api-keys"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiKeyValidateController.prototype, "getAllApiKeys", null);
__decorate([
    (0, common_1.Post)("validate-client-key"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeyValidateController.prototype, "validateClientKey", null);
exports.ApiKeyValidateController = ApiKeyValidateController = __decorate([
    (0, common_1.Controller)("api-key-validate"),
    __metadata("design:paramtypes", [api_key_validate_service_1.ApiKeyValidateService])
], ApiKeyValidateController);
//# sourceMappingURL=api-key-validate.controller.js.map