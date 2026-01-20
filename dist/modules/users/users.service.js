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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const assistant_chat_schema_1 = require("./schemas/assistant-chat.schema");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const UserSchema_1 = require("./schemas/UserSchema");
const faqs_service_1 = require("../faqs/faqs.service");
let UsersService = class UsersService {
    constructor(model, userModel, faqsService) {
        this.model = model;
        this.userModel = userModel;
        this.faqsService = faqsService;
    }
    async createAssistantChatData(body) {
        const assistantChat = new this.model(body);
        await assistantChat.save();
        return assistantChat;
    }
    async addFunctionToAssistant(assistantId, userId, newFunction) {
        const assistant = await this.model.findOneAndUpdate({ _id: assistantId, user_id: userId }, { $push: { funciones: newFunction } }, { new: true });
        if (!assistant) {
            throw new common_1.NotFoundException("Assistant not found");
        }
        return assistant;
    }
    async updateFunction(assistantId, userId, functionId, updateData) {
        const updateFields = {};
        if (updateData.name !== undefined)
            updateFields["funciones.$.name"] = updateData.name;
        if (updateData.description !== undefined)
            updateFields["funciones.$.description"] = updateData.description;
        if (updateData.type !== undefined)
            updateFields["funciones.$.type"] = updateData.type;
        if (updateData.code !== undefined)
            updateFields["funciones.$.code"] = updateData.code;
        if (updateData.credentials !== undefined)
            updateFields["funciones.$.credentials"] = updateData.credentials;
        if (updateData.api) {
            if (updateData.api.url !== undefined)
                updateFields["funciones.$.api.url"] = updateData.api.url;
            if (updateData.api.method !== undefined)
                updateFields["funciones.$.api.method"] = updateData.api.method;
            if (updateData.api.headers !== undefined)
                updateFields["funciones.$.api.headers"] = updateData.api.headers;
            if (updateData.api.parameters !== undefined)
                updateFields["funciones.$.api.parameters"] = updateData.api.parameters;
            if (updateData.api.auth !== undefined)
                updateFields["funciones.$.api.auth"] = updateData.api.auth;
        }
        const assistant = await this.model.findOneAndUpdate({
            _id: assistantId,
            user_id: userId,
            "funciones._id": functionId,
        }, { $set: updateFields }, { new: true });
        if (!assistant) {
            throw new common_1.NotFoundException("Function or Assistant not found");
        }
        return assistant;
    }
    async deleteFunction(assistantId, userId, functionId) {
        const assistant = await this.model.findOneAndUpdate({ _id: assistantId, user_id: userId }, { $pull: { funciones: { _id: functionId } } }, { new: true });
        if (!assistant) {
            throw new common_1.NotFoundException("Assistant not found");
        }
        return assistant;
    }
    async getAssistantChatByChatIdAndUserIdAndFaqs(id, user_id) {
        const assistant_chat = await this.model
            .findOne({ _id: id, user_id })
            .exec();
        if (!assistant_chat) {
            throw new common_1.NotFoundException(`No se encontró el chat con chat_id ${id} para el usuario ${user_id}`);
        }
        const faqsDoc = await this.faqsService.getFaqs(user_id, id);
        const faqs = (faqsDoc?.faqs ?? []).map((f) => ({
            _id: f._id,
            question: f.question,
            answer: f.answer,
            category: f.category,
        }));
        return {
            ...assistant_chat.toObject(),
            faqs,
        };
    }
    async getAllAssistantChatsByUserId(user_id) {
        return this.model.find({ user_id: user_id }).exec();
    }
    async getAssistantChatByUserId(user_id) {
        return this.model.findOne({ user_id: user_id }).exec();
    }
    async getAssistantById(assistantId, userId) {
        return this.model.findOne({ _id: assistantId, user_id: userId }).exec();
    }
    async crearUsuario(usuario) {
        const createdUsuario = new this.userModel(usuario);
        return createdUsuario.save();
    }
    async obtenerUsuarios(email) {
        const usuario = await this.userModel.findOne({ email }).exec();
        if (!usuario) {
            return null;
        }
        return usuario;
    }
    async actualizarUsuario(id, usuario) {
        const updatedUsuario = await this.userModel
            .findByIdAndUpdate(id, usuario, {
            new: true,
        })
            .exec();
        if (!updatedUsuario) {
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return updatedUsuario;
    }
    async eliminarUsuario(id) {
        const deletedUsuario = await this.userModel.findByIdAndDelete(id).exec();
        if (!deletedUsuario) {
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return deletedUsuario;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(assistant_chat_schema_1.AssistantChat.name)),
    __param(1, (0, mongoose_1.InjectModel)(UserSchema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        faqs_service_1.FaqsService])
], UsersService);
//# sourceMappingURL=users.service.js.map