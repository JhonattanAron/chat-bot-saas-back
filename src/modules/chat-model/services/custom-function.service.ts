import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AssistantChatDocument } from "src/modules/users/schemas/assistant-chat.schema";
import { AssistantChat } from "src/modules/users/schemas/assistant-chat.schema";

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
    @InjectModel(AssistantChat.name)
    private readonly assistantChatModel: Model<AssistantChatDocument>
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
        this.logger.error(
          `Assistant not found for userId: ${userId}, assistantId: ${assistantId}`
        );
        return {
          success: false,
          error: "Assistant not found",
          result: null,
          executedFunction: functionName,
        };
      }

      this.logger.log(
        `Found assistant with ${assistant.funciones?.length || 0} functions`
      );

      // Validar que existan funciones
      if (!assistant.funciones || assistant.funciones.length === 0) {
        this.logger.warn(`No functions found for assistant ${assistantId}`);
        return {
          success: false,
          error: "No functions available for this assistant",
          result: null,
          executedFunction: functionName,
        };
      }

      // Log de todas las funciones disponibles para debugging
      assistant.funciones.forEach((func, index) => {
        this.logger.log(
          `Function ${index}: name="${func?.name}", type="${func?.type}"`
        );
      });

      // Buscar la función específica en el array de funciones con validación
      const functionDef = assistant.funciones.find((func) => {
        if (!func || !func.name) {
          this.logger.warn(`Found function with undefined name at index`);
          return false;
        }
        return func.name.toUpperCase() === functionName.toUpperCase();
      });

      if (!functionDef) {
        this.logger.error(
          `Function ${functionName} not found. Available functions: ${assistant.funciones.map((f) => f?.name || "undefined").join(", ")}`
        );
        return {
          success: false,
          error: `Function ${functionName} not found. Available functions: ${assistant.funciones.map((f) => f?.name || "undefined").join(", ")}`,
          result: null,
          executedFunction: functionName,
        };
      }

      this.logger.log(`Found function definition:`, {
        name: functionDef.name,
        type: functionDef.type,
        hasApi: !!functionDef.api,
        hasCode: !!functionDef.code,
      });

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

      if (api.headers && Array.isArray(api.headers)) {
        api.headers.forEach((header: any) => {
          if (header && header.key && header.value) {
            headers[header.key] = header.value;
          }
        });
      }

      let requestUrl = api.url;
      let requestBody: string | undefined;

      // Handle parameters based on method type
      if (api.method.toUpperCase() === "GET") {
        const queryParams = new URLSearchParams();
        if (
          api.parameters &&
          Array.isArray(api.parameters) &&
          parameters.length > 0
        ) {
          api.parameters.forEach((param: any, index: number) => {
            if (param && param.name && index < parameters.length) {
              queryParams.append(param.name, parameters[index].trim());
            }
          });
        }
        const queryString = queryParams.toString();
        if (queryString) {
          requestUrl = `${api.url}?${queryString}`;
        }
      } else {
        // For POST, PUT, etc., send parameters in the body
        const body: Record<string, any> = {};
        if (
          api.parameters &&
          Array.isArray(api.parameters) &&
          parameters.length > 0
        ) {
          api.parameters.forEach((param: any, index: number) => {
            if (param && param.name && index < parameters.length) {
              body[param.name] = parameters[index].trim();
            }
          });
        }
        requestBody = JSON.stringify(body);
      }

      this.logger.log(`Making API call to: ${requestUrl}`);
      this.logger.log(`Method: ${api.method}`);
      this.logger.log(`Headers:`, headers);
      if (requestBody) {
        this.logger.log(`Body:`, requestBody);
      }

      // Realizar la petición HTTP
      const response = await fetch(requestUrl, {
        method: api.method.toUpperCase(),
        headers,
        body: requestBody,
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

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
      this.logger.log(`Executing custom function: ${functionDef.name}`);
      this.logger.log(`Code: ${functionDef.code}`);
      this.logger.log(`Parameters: ${parameters.join(", ")}`);

      // Simulación de ejecución de código personalizado
      // En un entorno real, aquí usarías un sandbox como vm2 o similar
      const result = {
        message: `Custom function ${functionDef.name} executed successfully`,
        parameters: parameters,
        timestamp: new Date().toISOString(),
        code: functionDef.code,
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

      if (!assistant || !assistant.funciones) {
        this.logger.warn(
          `No assistant or functions found for userId: ${userId}, assistantId: ${assistantId}`
        );
        return [];
      }

      // Filtrar funciones válidas y mapear
      return assistant.funciones
        .filter((func) => func && func.name && func.type) // Solo funciones válidas
        .map((func) => ({
          name: func.name,
          description: func.description || "",
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

    this.logger.log(
      `Parsed function call: ${functionName} with parameters: [${parameters.join(", ")}]`
    );

    return {
      functionName,
      parameters,
    };
  }
}
