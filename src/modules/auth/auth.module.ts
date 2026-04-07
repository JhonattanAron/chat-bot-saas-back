import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { MailService } from "./service/confirmMail.service";
import { ContractedAssetsModule } from "../contracted-assets/contracted-assets.module";

@Module({
  imports: [
    UsersModule,
    ContractedAssetsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        console.log("JWT_SECRET:", secret); // Imprime la clave secreta para pruebas
        return {
          secret,
          signOptions: { expiresIn: "1h" },
        };
      },
    }),
  ],
  providers: [AuthService, MailService],
  controllers: [AuthController],
})
export class AuthModule {}
