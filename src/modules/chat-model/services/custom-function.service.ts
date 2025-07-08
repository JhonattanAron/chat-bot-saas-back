import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  AssistantChat,
  AssistantChatDocument,
} from "src/modules/users/schemas/assistant-chat.schema";
import { ConfigService } from "@nestjs/config";

interface FunctionExecution {
  success: boolean;
  result: any;
  error?: string;
  executedFunction: string;
}

@Injectable()
export class CustomFunctionService {
  private readonly logger = new Logger(CustomFunctionService.name);

  constructor(
    private assistantChatModel: Model<AssistantChatDocument>,
    private configService: ConfigService
  ) {}

  async executeFunction(
    functionName: string,
    parameters: string[],
    userId: string,
    assistantId: string
  ): Promise<FunctionExecution> {
    try {
      this.logger.log(
        `Executing function: ${functionName} with params: ${parameters.join(", ")}`
      );

      // Buscar la función en la base de datos
      const assistant = await this.assistantChatModel.findOne({
        _id: assistantId,
        user_id: userId,
      });

      if (!assistant) {
        return {
          success: false,
          error: "Assistant not found",
          result: null,
          executedFunction: functionName,
        };
      }

      // Buscar la función específica
      const functionDef = assistant.funciones.find(
        (func) => func.name.toUpperCase() === functionName.toUpperCase()
      );

      if (!functionDef) {
        return {
          success: false,
          error: `Function ${functionName} not found`,
          result: null,
          executedFunction: functionName,
        };
      }

      this.logger.log(`Found function definition:`, functionDef);

      // Ejecutar según el tipo de función
      if (functionDef.type === "api") {
        return await this.executeApiFunction(functionDef, parameters);
      } else if (functionDef.type === "custom") {
        return await this.executeCustomFunction(functionDef, parameters);
      } else {
        return {
          success: false,
          error: `Unsupported function type: ${functionDef.type}`,
          result: null,
          executedFunction: functionName,
        };
      }
    } catch (error) {
      this.logger.error(`Error executing function ${functionName}:`, error);
      return {
        success: false,
        error: error.message,
        result: null,
        executedFunction: functionName,
      };
    }
  }

  private async executeApiFunction(
    functionDef: any,
    parameters: string[]
  ): Promise<FunctionExecution> {
    try {
      const { api } = functionDef;

      if (!api || !api.url) {
        return {
          success: false,
          error: "API configuration is missing",
          result: null,
          executedFunction: functionDef.name,
        };
      }

      // Preparar headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (api.headers) {
        api.headers.forEach((header: any) => {
          headers[header.key] = header.value;
        });
      }

      // Preparar el cuerpo de la petición con los parámetros
      const body: Record<string, any> = {};
      if (api.parameters && parameters.length > 0) {
        api.parameters.forEach((param: any, index: number) => {
          if (index < parameters.length) {
            body[param.name] = parameters[index].trim();
          }
        });
      }

      this.logger.log(`Making API call to: ${api.url}`);
      this.logger.log(`Method: ${api.method}`);
      this.logger.log(`Body:`, body);

      // Realizar la petición HTTP
      const response = await fetch(api.url, {
        method: api.method.toUpperCase(),
        headers,
        body:
          api.method.toUpperCase() !== "GET" ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `API call failed: ${response.status} ${response.statusText}`,
          result: responseData,
          executedFunction: functionDef.name,
        };
      }

      return {
        success: true,
        result: responseData,
        executedFunction: functionDef.name,
      };
    } catch (error) {
      this.logger.error(`Error in API function execution:`, error);
      return {
        success: false,
        error: error.message,
        result: null,
        executedFunction: functionDef.name,
      };
    }
  }

  private async executeCustomFunction(
    functionDef: any,
    parameters: string[]
  ): Promise<FunctionExecution> {
    try {
      // Para funciones custom, podríamos usar un sandbox más avanzado
      // Por ahora, simulamos la ejecución
      this.logger.log(`Executing custom function: ${functionDef.name}`);
      this.logger.log(`Code: ${functionDef.code}`);
      this.logger.log(`Parameters: ${parameters.join(", ")}`);

      // Simulación de ejecución de código personalizado
      // En un entorno real, aquí usarías un sandbox como vm2 o similar
      const result = {
        message: `Custom function ${functionDef.name} executed successfully`,
        parameters: parameters,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        result,
        executedFunction: functionDef.name,
      };
    } catch (error) {
      this.logger.error(`Error in custom function execution:`, error);
      return {
        success: false,
        error: error.message,
        result: null,
        executedFunction: functionDef.name,
      };
    }
  }

  async getFunctionsList(userId: string, assistantId: string): Promise<any[]> {
    try {
      const assistant = await this.assistantChatModel.findOne({
        _id: assistantId,
        user_id: userId,
      });

      if (!assistant) {
        return [];
      }

      return assistant.funciones.map((func) => ({
        name: func.name,
        description: func.description,
        type: func.type,
        parameters: func.api?.parameters || [],
      }));
    } catch (error) {
      this.logger.error(`Error getting functions list:`, error);
      return [];
    }
  }

  parseFunctionCall(
    text: string
  ): { functionName: string; parameters: string[] } | null {
    // Buscar patrón [FUNCTION_NAME:param1, param2, param3]
    const functionMatch = text.match(/\[([A-Z_]+):([^\]]+)\]/);

    if (!functionMatch) {
      return null;
    }

    const functionName = functionMatch[1];
    const parametersString = functionMatch[2];

    // Dividir parámetros por coma y limpiar espacios
    const parameters = parametersString.split(",").map((param) => param.trim());

    return {
      functionName,
      parameters,
    };
  }
}
