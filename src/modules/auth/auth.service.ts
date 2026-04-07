import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { Response } from "express";
import { User } from "../users/schemas/UserSchema";
import { randomUUID } from "crypto";
import { MailService } from "./service/confirmMail.service";
import * as bcrypt from "bcrypt";
import { ContractedAssetsService } from "../contracted-assets/contracted-assets.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private userService: UsersService,
    private readonly mailService: MailService,
    private readonly contractedAssetsService: ContractedAssetsService,
  ) {}

  async signIn(
    email: string,
    pass: string,
    res: Response,
  ): Promise<{ message: string }> {
    // Verificar si el usuario existe
    const user = await this.userService.obtenerUsuarios(email);

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Verificar si el usuario no tiene contraseña pero tiene googleId
    if (!user.password && user.googleId) {
      throw new UnauthorizedException(
        "Este usuario solo puede acceder con Google",
      );
    }

    // Verificar si la contraseña es correcta usando bcrypt
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Crear el payload para el token
    const payload = {
      name: user.name,
      sub: user._id,
      email: user.email,
      image: user.image,
      binding_id: (user._id as string).toString(),
    };
    console.log("Payload:", payload);

    // Generar el token JWT
    const token = this.jwtService.sign(payload);
    console.log("Generated Token:", token);
    await this.contractedAssetsService.createFreeContractForUser(
      (user._id as string).toString(),
    );

    res.cookie("jwt", token, {
      httpOnly: true, // Asegura que la cookie no sea accesible desde JavaScript
      secure: process.env.NODE_ENV === "production", // Solo usar HTTPS en producción
      sameSite: "strict", // Evitar envío de cookies en solicitudes de terceros
      maxAge: 60 * 60 * 1000, // 1 hora
    });

    return { message: "Login exitoso" };
  }

  async handleGoogleLogin(userData: User) {
    let user = await this.userService.obtenerUsuarios(userData.email);

    if (!user) {
      console.log("Usuario Null Creandolo");
      user = await this.userService.crearUsuario(userData);
    }
    console.log("Usuario no Nulo solo estamos iniciando session");

    // Crear el payload para el token
    const payload = {
      name: user.name,
      email: user.email,
      image: user.image,
      binding_id: (user._id as string).toString(),
    };

    console.log("Payload:", payload);

    // Generar el token JWT
    const token = this.jwtService.sign(payload);
    console.log("Generated Google Token:", token);

    await this.contractedAssetsService.createFreeContractForUser(
      (user._id as string).toString(),
    );

    return {
      binding_id: user._id,
      email: user.email,
      token,
    };
  }

  // Número de rondas de salt para bcrypt (10-12 es recomendado)
  private readonly SALT_ROUNDS = 10;

  async register(name: string, email: string, password: string) {
    // 1️⃣ Verificar si ya existe usuario con el mismo email
    const existingUser = await this.userService.obtenerUsuarios(email);
    if (existingUser) {
      throw new BadRequestException("El correo ya está registrado");
    }

    // 2️⃣ Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // 3️⃣ Generar token de verificación de email
    const emailVerificationToken = randomUUID();

    // 4️⃣ Crear usuario
    const user = await this.userService.crearUsuario({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken,
    });

    // 5️⃣ Enviar correo de verificación
    await this.mailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
    );

    // 6️⃣ Asignar contrato Free automáticamente
    await this.contractedAssetsService.createFreeContractForUser(
      (user._id as string).toString(),
    );

    // 7️⃣ Retornar mensaje de registro
    return {
      message: "Usuario registrado. Revisa tu correo para confirmar tu cuenta.",
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException("Token requerido");
    }

    const user = await this.userService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException("Token inválido o expirado");
    }

    if (user.emailVerified) {
      return { message: "El correo ya fue verificado" };
    }

    user.emailVerified = true;
    user.emailVerificationToken = "";

    await user.save();

    return { message: "Correo verificado correctamente" };
  }
}
