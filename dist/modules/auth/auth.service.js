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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(jwtService, userService) {
        this.jwtService = jwtService;
        this.userService = userService;
    }
    async signIn(email, pass, res) {
        const user = await this.userService.obtenerUsuarios(email);
        if (!user) {
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        }
        if (!user.password && user.googleId) {
            throw new common_1.UnauthorizedException("Este usuario solo puede acceder con Google");
        }
        if (user.password !== pass) {
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        }
        const payload = {
            name: user.name,
            sub: user._id,
            email: user.email,
            image: user.image,
            binding_id: user._id.toString(),
        };
        console.log("Payload:", payload);
        const token = this.jwtService.sign(payload);
        console.log("Generated Token:", token);
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 1000,
        });
        return { message: "Login exitoso" };
    }
    async handleGoogleLogin(userData) {
        let user = await this.userService.obtenerUsuarios(userData.email);
        if (!user) {
            console.log("Usuario Null Creandolo");
            user = await this.userService.crearUsuario(userData);
        }
        console.log("Usuario no Nulo solo estamos iniciando session");
        const payload = {
            name: user.name,
            email: user.email,
            image: user.image,
            binding_id: user._id.toString(),
        };
        console.log("Payload:", payload);
        const token = this.jwtService.sign(payload);
        console.log("Generated Google Token:", token);
        return {
            binding_id: user._id,
            email: user.email,
            token,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map