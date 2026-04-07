import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { OpenRouterService } from "./openrouter.service";
import { ResourcesService } from "src/modules/service-resources/resources.service";
import { ApiKeyValidateService } from "src/modules/api-key-validate/api-key-validate.service";
import { GlobalLogsService } from "../log.service";

interface ReferenceImageDto {
  url: string;
  role: string;
  priority?: "alta" | "media" | "baja";
}

interface GenerateImageDto {
  prompt: string;
  referenceImages?: ReferenceImageDto[];
}

@Controller("openrouter")
export class OpenRouterController {
  constructor(
    private readonly openRouterService: OpenRouterService,
    private readonly resourseservice: ResourcesService,
    private readonly apikeyvalidateservice: ApiKeyValidateService,
    private readonly globalLogsService: GlobalLogsService, // <-- inyectamos logs
  ) {}

  @Post("generate")
  async generateImage(
    @Body() body: GenerateImageDto,
    @Headers("x-api-key") apiKey: string,
  ) {
    const { prompt, referenceImages } = body;

    if (!prompt) {
      return { success: false, message: "El prompt es obligatorio" };
    }

    // validar API key y obtener userId
    const client = await this.apikeyvalidateservice.validateAndGetUser(apiKey);
    if (!client) {
      return { success: false, message: "API key inválida" };
    }
    const { userId } = client;

    // verificar créditos antes de generar la imagen
    const hasCredits = await this.resourseservice.hasEnoughCredits(userId, 0.5);
    if (!hasCredits) {
      // log de intento fallido por créditos
      await this.globalLogsService.createLog({
        level: "warning",
        message: "Créditos insuficientes para generar imagen",
        service: "Generación de imágenes",
        userId,
        meta: { requiredCredits: 0.5 },
      });

      throw new BadRequestException(
        "No tienes créditos suficientes para generar la imagen",
      );
    }

    try {
      // generar imagen
      const result = await this.openRouterService.generateImage(
        prompt,
        referenceImages,
      );

      const content = result?.choices?.[0];

      if (!content) {
        await this.globalLogsService.createLog({
          level: "error",
          message: "No se generó imagen",
          service: "Generación de imágenes",
          userId,
          meta: { prompt, referenceImagesCount: referenceImages?.length || 0 },
        });

        return { success: false, message: "No se generó imagen" };
      }

      // descontar créditos solo si se generó imagen
      await this.resourseservice.consumeResource(userId, "credits", 0.5);

      // log de éxito
      await this.globalLogsService.createLog({
        level: "info",
        message: "Imagen generada correctamente",
        service: "Generación de imágenes",
        userId,
        meta: {
          prompt,
          referenceImagesCount: referenceImages?.length || 0,
          credits: 0.5,
        },
      });

      return { success: true, data: result };
    } catch (error: any) {
      await this.globalLogsService.createLog({
        level: "error",
        message: "Error generando imagen",
        service: "Generación de imágenes",
        userId,
        meta: { error: error.message, stack: error.stack },
      });

      throw error;
    }
  }
}
