import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { Response } from "express";
import { User } from "../users/schemas/UserSchema";
export declare class AuthService {
    private readonly jwtService;
    private userService;
    constructor(jwtService: JwtService, userService: UsersService);
    signIn(email: string, pass: string, res: Response): Promise<{
        message: string;
    }>;
    handleGoogleLogin(userData: User): Promise<{
        binding_id: unknown;
        email: string;
        token: string;
    }>;
}
