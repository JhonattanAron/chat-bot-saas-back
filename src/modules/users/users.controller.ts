import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Put,
  Delete,
  Param,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateAssistantDto } from "./schemas/create-asistantdto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== ASSISTANTS ====================

  @Post("assistant-chat")
  createAssistantChat(@Body() body: CreateAssistantDto) {
    return this.usersService.createAssistantChatData(body);
  }

  @Get("assistant-chats")
  async getAllAssistantChats(@Query("user_id") user_id: string) {
    return this.usersService.getAllAssistantChatsByUserId(user_id);
  }

  @Get("assistant-chat")
  async getAssistantChat(
    @Query("id") id: string,
    @Query("user_id") user_id: string
  ) {
    return this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(
      id,
      user_id
    );
  }

  // ==================== FUNCIONES PERSONALIZADAS ====================

  @Post("functions")
  async addFunction(
    @Body()
    body: {
      user_id: string;
      assistant_id: string;
      function: {
        name: string;
        description?: string;
        type: "api" | "custom";
        api?: {
          url: string;
          method: string;
          headers?: { key: string; value: string }[];
          parameters?: {
            name: string;
            type: string;
            required: boolean;
            description?: string;
          }[];
          auth?: { type: string; value: string };
        };
        code?: string;
        credentials?: { name: string; value: string; description?: string }[];
      };
    }
  ) {
    try {
      const { user_id, assistant_id, function: newFunction } = body;

      const assistant =
        await this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(
          assistant_id,
          user_id
        );

      if (!assistant) {
        return {
          success: false,
          error: "Assistant not found",
        };
      }

      const existingFunction = assistant.funciones?.find(
        (f: any) => f.name.toUpperCase() === newFunction.name.toUpperCase()
      );

      if (existingFunction) {
        return {
          success: false,
          error: `Function with name '${newFunction.name}' already exists`,
        };
      }

      const updatedAssistant = await this.usersService.addFunctionToAssistant(
        assistant_id,
        user_id,
        newFunction
      );

      const newFunctionId =
        updatedAssistant.funciones[
          updatedAssistant.funciones.length - 1
        ]?._id?.toString();

      return {
        success: true,
        message: "Función agregada exitosamente",
        function_name: newFunction.name,
        assistant_id,
        total_functions: updatedAssistant.funciones.length,
        function_id: newFunctionId,
      };
    } catch (error) {
      console.error("Error adding function:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("functions")
  async getFunctions(
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string
  ) {
    try {
      const assistant =
        await this.usersService.getAssistantChatByChatIdAndUserIdAndFaqs(
          assistant_id,
          user_id
        );

      if (!assistant) {
        return {
          success: false,
          error: "Assistant not found",
        };
      }

      return {
        success: true,
        assistant_id,
        assistant_name: assistant.name,
        functions:
          assistant.funciones?.map((func: any) => ({
            id: func._id?.toString(),
            name: func.name,
            description: func.description,
            type: func.type,
            parameters: func.api?.parameters || [],
            hasCode: !!func.code,
            hasApi: !!func.api,
          })) || [],
      };
    } catch (error) {
      console.error("Error getting functions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put("functions/:functionId")
  async updateFunction(
    @Param("functionId") functionId: string,
    @Body()
    body: {
      user_id: string;
      assistant_id: string;
      function: {
        name?: string;
        description?: string;
        type?: "api" | "custom";
        api?: {
          url?: string;
          method?: string;
          headers?: { key: string; value: string }[];
          parameters?: {
            name: string;
            type: string;
            required: boolean;
            description?: string;
          }[];
          auth?: { type: string; value: string };
        };
        code?: string;
        credentials?: { name: string; value: string; description?: string }[];
      };
    }
  ) {
    try {
      const { user_id, assistant_id, function: updateData } = body;

      const updatedAssistant = await this.usersService.updateFunction(
        assistant_id,
        user_id,
        functionId,
        updateData
      );

      if (!updatedAssistant) {
        return {
          success: false,
          error: "Function or Assistant not found",
        };
      }

      const updatedFunction = updatedAssistant.funciones?.find(
        (f: any) => f._id?.toString() === functionId
      );

      return {
        success: true,
        message: "Función actualizada exitosamente",
        function_id: functionId,
        function_name: updatedFunction?.name,
        assistant_id,
      };
    } catch (error) {
      console.error("Error updating function:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete("functions/:functionId")
  async deleteFunction(
    @Param("functionId") functionId: string,
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string
  ) {
    try {
      const updatedAssistant = await this.usersService.deleteFunction(
        assistant_id,
        user_id,
        functionId
      );

      if (!updatedAssistant) {
        return {
          success: false,
          error: "Function or Assistant not found",
        };
      }

      return {
        success: true,
        message: "Función eliminada exitosamente",
        function_id: functionId,
        assistant_id,
        remaining_functions: updatedAssistant.funciones.length,
      };
    } catch (error) {
      console.error("Error deleting function:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== EJEMPLO DE FUNCIONES DE PRUEBA ====================

  @Post("create-sample-functions")
  async createSampleFunctions(@Body() body: { user_id: string }) {
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
        await this.usersService.createAssistantChatData(sampleAssistant);

      return {
        success: true,
        message: "Asistente creado exitosamente con funciones de ejemplo",
        assistant_id: result._id?.toString(),
        user_id: body.user_id,
        funciones_disponibles: result.funciones.map(
          (f: any) => `${f.name} - ${f.description}`
        ),
        next_steps: [
          `POST /chat/start con assistant_id: ${result._id}`,
          "Prueba: 'envía un correo a test@email.com con asunto Hola y mensaje Test'",
          "Prueba: 'procesa estos datos: usuario, 123, activo'",
        ],
      };
    } catch (error) {
      console.error("Error creating sample functions:", error);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  @Post("test")
  async testEndpoint(@Body() body: any) {
    return {
      success: true,
      message: "Users controller is working",
      received_body: body,
      timestamp: new Date().toISOString(),
    };
  }
}
