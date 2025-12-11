import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { User } from "../users/schemas/UserSchema";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  async signIn(@Body() signInDto: Record<string, any>, @Res() res: Response) {
    const result = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
      res
    );
    return res.json(result);
  }

  @Get("me")
  async getProfile(@Req() req: Request) {
    const token = req.cookies["token"]; // Obtener la cookie

    if (!token) {
      throw new UnauthorizedException("No autenticado");
    }

    try {
      const decoded = this.jwtService.verify(token);
      return { user: decoded };
    } catch (error) {
      throw new UnauthorizedException("Token inválido");
    }
  }

  @Post("logout")
  logout(@Res() res: Response) {
    res.clearCookie("token", { path: "/" });
    return res.status(200).json({ message: "Logout exitoso" });
  }

  @Post("google-login")
  async googleLogin(@Body() userData: User) {
    try {
      const result = await this.authService.handleGoogleLogin(userData);
      return result;
    } catch (error) {
      console.error("Error en /auth/google-login:", error);
      throw new console.error("Error interno");
    }
  }
}
