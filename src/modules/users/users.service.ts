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
import { CreateAssistantDto } from "./schemas/create-asistantdto";
import { FaqsService } from "../faqs/faqs.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(AssistantChat.name)
    private model: Model<AssistantChatDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly faqsService: FaqsService,
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
    newFunction: any,
  ) {
    const assistant = await this.model.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      { $push: { funciones: newFunction } },
      { new: true },
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
    updateData: any,
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
      { new: true },
    );

    if (!assistant) {
      throw new NotFoundException("Function or Assistant not found");
    }

    return assistant;
  }

  async deleteFunction(
    assistantId: string,
    userId: string,
    functionId: string,
  ) {
    const assistant = await this.model.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      { $pull: { funciones: { _id: functionId } } },
      { new: true },
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
        `No se encontró el chat con chat_id ${id} para el usuario ${user_id}`,
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

  async crearUsuario(usuario: Partial<User>): Promise<User> {
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
  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userModel.findOne({
      emailVerificationToken: token,
    });
  }

  // ==================== MÉTODOS DE SEGURIDAD DE CONTRASEÑA ====================

  private readonly SALT_ROUNDS = 10;

  /**
   * Hashea una contraseña usando bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compara una contraseña en texto plano con un hash
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Actualiza la contraseña de un usuario (la hashea antes de guardar)
   */
  async actualizarPassword(userId: string, newPassword: string): Promise<User> {
    const hashedPassword = await this.hashPassword(newPassword);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return updatedUser;
  }

  /**
   * Verifica la contraseña actual y actualiza a una nueva
   */
  async cambiarPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (!user.password) {
      throw new ConflictException(
        "Este usuario no tiene contraseña configurada",
      );
    }

    const isCurrentPasswordValid = await this.comparePassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new ConflictException("La contraseña actual es incorrecta");
    }

    await this.actualizarPassword(userId, newPassword);

    return { message: "Contraseña actualizada correctamente" };
  }
}
