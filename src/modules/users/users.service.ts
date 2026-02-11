import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./schemas/UserSchema";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  @InjectModel(User.name)
  private userModel: Model<User>;

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

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

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
