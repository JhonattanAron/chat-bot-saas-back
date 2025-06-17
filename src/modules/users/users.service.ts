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

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(AssistantChat.name)
    private model: Model<AssistantChatDocument>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createAssistantChatData(@Body() body: CreateAssistantDto) {
    // Verifica si ya existe un AssistantChat para ese usuario
    const user_id = body.user_id;
    const exists = await this.model.findOne({ user_id });
    if (exists) {
      throw new ConflictException(
        "Ya existe un AssistantChat para este usuario."
      );
    }
    const assistantChat = new this.model(body);
    await assistantChat.save();
    return assistantChat;
  }

  async getAssistantChatByUserId(user_id: string) {
    return this.model.findOne({ user_id: user_id }).exec();
  }

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
