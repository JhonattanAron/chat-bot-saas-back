import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { Response } from "express";
import { User } from "../users/schemas/UserSchema";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private userService: UsersService
  ) {}

  async signIn(
    email: string,
    pass: string,
    res: Response
  ): Promise<{ message: string }> {
    // Verificar si el usuario existe
    const user = await this.userService.obtenerUsuarios(email);

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // Verificar si el usuario no tiene contraseña pero tiene googleId
    if (!user.password && user.googleId) {
      throw new UnauthorizedException(
        "Este usuario solo puede acceder con Google"
      );
    }

    // Verificar si la contraseña es correcta
    if (user.password !== pass) {
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

    return {
      binding_id: user._id,
      email: user.email,
      token,
    };
  }
}
