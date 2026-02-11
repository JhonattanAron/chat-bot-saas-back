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
import { FunctionsService } from "./functions.service";
import { AssistantChatsService } from "../assistant-chats/assistant-chats.service";

@Controller("functions")
export class FunctionsController {
  constructor(
    private readonly functionsService: FunctionsService,
    private readonly assistantChatsService: AssistantChatsService,
  ) {}

  @Post()
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
    },
  ) {
    try {
      const { user_id, assistant_id, function: newFunction } = body;

      const assistant = await this.assistantChatsService.getAssistantById(
        assistant_id,
        user_id,
      );

      if (!assistant) {
        return {
          success: false,
          error: "Assistant not found",
        };
      }

      const existingFunction = assistant.funciones?.find(
        (f: any) => f.name.toUpperCase() === newFunction.name.toUpperCase(),
      );

      if (existingFunction) {
        return {
          success: false,
          error: `Function with name '${newFunction.name}' already exists`,
        };
      }

      const updatedAssistant =
        await this.functionsService.addFunctionToAssistant(
          assistant_id,
          user_id,
          newFunction,
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

  @Get()
  async getFunctions(
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string,
  ) {
    try {
      if (!user_id || !assistant_id) {
        return {
          success: false,
          error:
            "Missing required parameters: user_id and assistant_id are required",
        };
      }

      const assistant = await this.assistantChatsService.getAssistantById(
        assistant_id,
        user_id,
      );

      if (!assistant) {
        return {
          success: false,
          error: "Assistant not found",
        };
      }

      const formattedFunctions =
        assistant.funciones?.map((func: any) => ({
          id: func._id?.toString(),
          name: func.name,
          description: func.description,
          type: func.type,
          api: func.api
            ? {
                url: func.api.url,
                method: func.api.method,
                headers: func.api.headers || [],
                parameters: func.api.parameters || [],
                auth: func.api.auth,
              }
            : undefined,
          code: func.code,
          credentials: func.credentials || [],
          hasCode: !!func.code,
          hasApi: !!func.api,
        })) || [];

      return {
        success: true,
        assistant_id,
        assistant_name: assistant.name,
        total_functions: formattedFunctions.length,
        functions: formattedFunctions,
      };
    } catch (error) {
      console.error("Error getting functions:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(":functionId")
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
    },
  ) {
    try {
      const { user_id, assistant_id, function: updateData } = body;

      const updatedAssistant = await this.functionsService.updateFunction(
        assistant_id,
        user_id,
        functionId,
        updateData,
      );

      if (!updatedAssistant) {
        return {
          success: false,
          error: "Function or Assistant not found",
        };
      }

      const updatedFunction = updatedAssistant.funciones?.find(
        (f: any) => f._id?.toString() === functionId,
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

  @Delete(":functionId")
  async deleteFunction(
    @Param("functionId") functionId: string,
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string,
  ) {
    try {
      const updatedAssistant = await this.functionsService.deleteFunction(
        assistant_id,
        user_id,
        functionId,
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
}
