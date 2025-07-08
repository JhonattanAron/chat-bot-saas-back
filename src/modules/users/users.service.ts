import {
  Body,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssistantChat,
  AssistantChatDocument,
} from "./schemas/assistant-chat.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./schemas/UserSchema";
import { FunctionSchema } from "./schemas/functions-schema";
import { CreateAssistantDto } from "./schemas/create-asistantdto";
import { FaqsService } from "../faqs/faqs.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(AssistantChat.name)
    private model: Model<AssistantChatDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly faqsService: FaqsService
  ) {}

  async createAssistantChatData(body: CreateAssistantDto) {
    const assistantChat = new this.model(body);
    await assistantChat.save();
    return assistantChat;
  }

  // ==================== MÉTODOS CRUD PARA FUNCIONES ====================

  async addFunctionToAssistant(
    assistantId: string,
    userId: string,
    newFunction: any
  ) {
    const assistant = await this.model.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      { $push: { funciones: newFunction } },
      { new: true }
    );

    if (!assistant) {
      throw new NotFoundException("Assistant not found");
    }

    return assistant;
  }

  async updateFunction(
    assistantId: string,
    userId: string,
    functionId: string,
    updateData: any
  ) {
    // Construir el objeto de actualización dinámicamente
    const updateFields: any = {};

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

    // Manejar actualización de API
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

    const assistant = await this.model.findOneAndUpdate(
      {
        _id: assistantId,
        user_id: userId,
        "funciones._id": functionId,
      },
      { $set: updateFields },
      { new: true }
    );

    if (!assistant) {
      throw new NotFoundException("Function or Assistant not found");
    }

    return assistant;
  }

  async deleteFunction(
    assistantId: string,
    userId: string,
    functionId: string
  ) {
    const assistant = await this.model.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      { $pull: { funciones: { _id: functionId } } },
      { new: true }
    );

    if (!assistant) {
      throw new NotFoundException("Assistant not found");
    }

    return assistant;
  }

  // ==================== MÉTODOS EXISTENTES ====================

  async getAssistantChatByChatIdAndUserIdAndFaqs(id: string, user_id: string) {
    const assistant_chat = await this.model
      .findOne({ _id: id, user_id })
      .exec();
    if (!assistant_chat) {
      throw new NotFoundException(
        `No se encontró el chat con chat_id ${id} para el usuario ${user_id}`
      );
    }

    const faqsDoc = await this.faqsService.getFaqs(user_id, id);
    const faqs = (faqsDoc?.faqs ?? []).map((f: any) => ({
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

  async getAllAssistantChatsByUserId(user_id: string) {
    return this.model.find({ user_id: user_id }).exec();
  }

  async getAssistantChatByUserId(user_id: string) {
    return this.model.findOne({ user_id: user_id }).exec();
  }

  async getAssistantById(assistantId: string, userId: string) {
    return this.model.findOne({ _id: assistantId, user_id: userId }).exec();
  }

  // ==================== MÉTODOS DE USUARIO ====================

  async crearUsuario(usuario: User): Promise<User> {
    const createdUsuario = new this.userModel(usuario);
    return createdUsuario.save();
  }

  async obtenerUsuarios(email: string): Promise<User | null> {
    const usuario = await this.userModel.findOne({ email }).exec();
    if (!usuario) {
      return null;
    }
    return usuario;
  }

  async actualizarUsuario(id: string, usuario: User): Promise<User> {
    const updatedUsuario = await this.userModel
      .findByIdAndUpdate(id, usuario, {
        new: true,
      })
      .exec();
    if (!updatedUsuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return updatedUsuario;
  }

  async eliminarUsuario(id: string): Promise<User> {
    const deletedUsuario = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUsuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return deletedUsuario;
  }
}
