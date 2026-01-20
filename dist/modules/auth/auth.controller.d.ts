import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { User } from "../users/schemas/UserSchema";
export declare class AuthController {
    private authService;
    private readonly jwtService;
    constructor(authService: AuthService, jwtService: JwtService);
    signIn(signInDto: Record<string, any>, res: Response): Promise<Response<any, Record<string, any>>>;
    getProfile(req: Request): Promise<{
        user: any;
    }>;
    logout(res: Response): Response<any, Record<string, any>>;
    googleLogin(userData: User): Promise<{
        binding_id: unknown;
        email: string;
        token: string;
    }>;
}
