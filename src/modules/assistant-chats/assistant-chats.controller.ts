import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Param,
  Put,
} from "@nestjs/common";
import { AssistantChatsService } from "./assistant-chats.service";
import { CreateAssistantDto } from "./create-assistant.dto";

@Controller("assistant-chats")
export class AssistantChatsController {
  constructor(private readonly assistantChatsService: AssistantChatsService) {}

  @Post()
  async createAssistant(@Body() body: CreateAssistantDto) {
    try {
      const assistant = await this.assistantChatsService.createAssistant(body);
      return {
        success: true,
        message: "Asistente creado exitosamente",
        assistant_id: assistant._id?.toString(),
        user_id: body.user_id,
        name: assistant.name,
      };
    } catch (error) {
      console.error("Error creating assistant:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(":assistantId")
  async getAssistant(
    @Param("assistantId") assistantId: string,
    @Query("user_id") user_id: string,
  ) {
    try {
      if (!user_id) {
        return {
          success: false,
          error: "user_id is required",
        };
      }

      const assistant =
        await this.assistantChatsService.getAssistantByIdAndFaqs(
          assistantId,
          user_id,
        );

      return {
        success: true,
        assistant,
      };
    } catch (error) {
      console.error("Error getting assistant:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  async getAllAssistants(@Query("user_id") user_id: string) {
    try {
      if (!user_id) {
        return {
          success: false,
          error: "user_id is required",
        };
      }

      const assistants =
        await this.assistantChatsService.getAllAssistantsByUserId(user_id);

      return {
        success: true,
        user_id,
        total_assistants: assistants.length,
        assistants,
      };
    } catch (error) {
      console.error("Error getting assistants:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(":assistantId")
  async updateAssistant(
    @Param("assistantId") assistantId: string,
    @Body() body: { user_id: string; updateData: Partial<CreateAssistantDto> },
  ) {
    try {
      const { user_id, updateData } = body;

      const assistant = await this.assistantChatsService.updateAssistant(
        assistantId,
        user_id,
        updateData,
      );

      return {
        success: true,
        message: "Asistente actualizado exitosamente",
        assistant_id: assistantId,
        assistant,
      };
    } catch (error) {
      console.error("Error updating assistant:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(":assistantId")
  async deleteAssistant(
    @Param("assistantId") assistantId: string,
    @Query("user_id") user_id: string,
  ) {
    try {
      if (!user_id) {
        return {
          success: false,
          error: "user_id is required",
        };
      }

      await this.assistantChatsService.deleteAssistant(assistantId, user_id);

      return {
        success: true,
        message: "Asistente eliminado exitosamente",
        assistant_id: assistantId,
      };
    } catch (error) {
      console.error("Error deleting assistant:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("sample")
  async createSampleAssistant(@Body() body: { user_id: string }) {
    try {
      const sampleAssistant: CreateAssistantDto = {
        user_id: body.user_id,
        name: "Asistente con Funciones",
        description:
          "Asistente que puede ejecutar funciones personalizadas como enviar correos y procesar datos",
        status: "active",
        type: "custom",
        use_case: "automation",
        welcome_message:
          "¡Hola! Puedo ayudarte a ejecutar funciones personalizadas como enviar correos.",
        funciones: [
          {
            name: "ENVIAR_CORREO",
            description:
              "Envía un correo electrónico a una dirección específica",
            type: "api",
            api: {
              url: "https://httpbin.org/post",
              method: "POST",
              headers: [
                { key: "Authorization", value: "Bearer test-token" },
                { key: "Content-Type", value: "application/json" },
              ],
              parameters: [
                {
                  name: "email",
                  type: "string",
                  required: true,
                  description: "Email del destinatario",
                },
                {
                  name: "subject",
                  type: "string",
                  required: true,
                  description: "Asunto del correo",
                },
                {
                  name: "message",
                  type: "string",
                  required: true,
                  description: "Mensaje del correo",
                },
              ],
            },
          },
          {
            name: "PROCESAR_DATOS",
            description:
              "Procesa datos personalizados usando código JavaScript",
            type: "custom",
            code: "console.log('Procesando datos:', parameters); return { processed: true, data: parameters, timestamp: new Date() };",
          },
        ],
      };

      const result =
        await this.assistantChatsService.createAssistant(sampleAssistant);

      return {
        success: true,
        message: "Asistente creado exitosamente con funciones de ejemplo",
        assistant_id: result._id?.toString(),
        user_id: body.user_id,
        funciones_disponibles: result.funciones.map(
          (f: any) => `${f.name} - ${f.description}`,
        ),
      };
    } catch (error) {
      console.error("Error creating sample assistant:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
