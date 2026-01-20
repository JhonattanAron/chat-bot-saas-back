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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyValidateService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = __importDefault(require("crypto"));
const api_key_1 = require("./schema/api-key");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
let ApiKeyValidateService = class ApiKeyValidateService {
    constructor(apiKeyModel) {
        this.apiKeyModel = apiKeyModel;
    }
    generateApiKey() {
        return crypto_1.default.randomBytes(32).toString("hex");
    }
    async createApiKey(name, user_id) {
        const newKey = this.generateApiKey();
        const createdApiKey = new this.apiKeyModel({
            key: newKey,
            name,
            user_id: user_id,
        });
        return createdApiKey.save();
    }
    async updateApiKey(id, name) {
        return this.apiKeyModel
            .findByIdAndUpdate(id, { name }, { new: true })
            .exec();
    }
    async deleteApiKey(id) {
        return this.apiKeyModel.findByIdAndDelete(id).exec();
    }
    async findAllApiKeys() {
        return this.apiKeyModel.find({}, { key: 0 }).exec();
    }
    async validateClientKey(clientKey) {
        const foundKey = await this.apiKeyModel.findOne({ key: clientKey }).exec();
        return !!foundKey;
    }
};
exports.ApiKeyValidateService = ApiKeyValidateService;
exports.ApiKeyValidateService = ApiKeyValidateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(api_key_1.ApiKey.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], ApiKeyValidateService);
//# sourceMappingURL=api-key-validate.service.js.map