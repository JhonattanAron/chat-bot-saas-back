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
  constructor(
    @InjectModel(AssistantChat.name)
    private readonly assistantChatModel: Model<AssistantChatDocument>,
  ) {}

  async executeFunction(
    functionName: string,
    parameters: Record<string, any> | string[],
    userId: string,
    assistantId: string,
  ): Promise<FunctionExecution> {
    try {
      console.log(
        `Executing function: ${functionName} with params:`,
        parameters,
      );

      // Handle both array and object parameter formats
      const paramArray = Array.isArray(parameters)
        ? parameters
        : Object.values(parameters);

      // Buscar la función en la base de datos
      const assistant = await this.assistantChatModel.findOne({
        _id: assistantId,
        user_id: userId,
      });

      if (!assistant) {
        console.error(
          `Assistant not found for userId: ${userId}, assistantId: ${assistantId}`,
        );
        return {
          success: false,
          error: "Assistant not found",
          result: null,
          executedFunction: functionName,
        };
      }

      console.log(
        `Found assistant with ${assistant.funciones?.length || 0} functions`,
      );

      // Validar que existan funciones
      if (!assistant.funciones || assistant.funciones.length === 0) {
        console.warn(`No functions found for assistant ${assistantId}`);
        return {
          success: false,
          error: "No functions available for this assistant",
          result: null,
          executedFunction: functionName,
        };
      }

      // Log de todas las funciones disponibles para debugging
      assistant.funciones.forEach((func, index) => {
        console.log(
          `Function ${index}: name="${func?.name}", type="${func?.type}"`,
        );
      });

      // Buscar la función específica en el array de funciones con validación
      const functionDef = assistant.funciones.find((func) => {
        if (!func || !func.name) {
          console.warn(`Found function with undefined name at index`);
          return false;
        }
        return func.name.toUpperCase() === functionName.toUpperCase();
      });

      if (!functionDef) {
        console.error(
          `Function ${functionName} not found. Available functions: ${assistant.funciones.map((f) => f?.name || "undefined").join(", ")}` +
            ` for userId: ${userId}, assistantId: ${assistantId}`,
        );
        return {
          success: false,
          error: `Function ${functionName} not found. Available functions: ${assistant.funciones.map((f) => f?.name || "undefined").join(", ")}`,
          result: null,
          executedFunction: functionName,
        };
      }

      console.log(`Found function definition:`, {
        name: functionDef.name,
        type: functionDef.type,
        hasApi: !!functionDef.api,
        hasCode: !!functionDef.code,
      });

      // Ejecutar según el tipo de función
      if (functionDef.type === "api") {
        return await this.executeApiFunction(functionDef, paramArray);
      } else if (functionDef.type === "custom") {
        return await this.executeCustomFunction(functionDef, paramArray);
      } else {
        return {
          success: false,
          error: `Unsupported function type: ${functionDef.type}`,
          result: null,
          executedFunction: functionName,
        };
      }
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
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
    paramArray: string[],
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
          paramArray.length > 0
        ) {
          api.parameters.forEach((param: any, index: number) => {
            if (param && param.name && index < paramArray.length) {
              const value =
                typeof paramArray[index] === "object"
                  ? JSON.stringify(paramArray[index])
                  : String(paramArray[index]);
              queryParams.append(param.name, value);
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
          paramArray.length > 0
        ) {
          api.parameters.forEach((param: any, index: number) => {
            if (param && param.name && index < paramArray.length) {
              body[param.name] = paramArray[index];
            }
          });
        }
        requestBody = JSON.stringify(body);
      }

      console.log(`Making API call to: ${requestUrl}`);
      console.log(`Method: ${api.method}`);
      console.log(`Headers:`, headers);
      if (requestBody) {
        console.log(`Body:`, requestBody);
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
      console.error(`Error in API function execution:`, error);
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
    paramArray: string[],
  ): Promise<FunctionExecution> {
    try {
      console.log(`Executing custom function: ${functionDef.name}`);
      console.log(`Code: ${functionDef.code}`);
      console.log(`Parameters: ${paramArray.join(", ")}`);

      // Simulación de ejecución de código personalizado
      // En un entorno real, aquí usarías un sandbox como vm2 o similar
      const result = {
        message: `Custom function ${functionDef.name} executed successfully`,
        parameters: paramArray,
        timestamp: new Date().toISOString(),
        code: functionDef.code,
      };

      return {
        success: true,
        result,
        executedFunction: functionDef.name,
      };
    } catch (error) {
      console.error(`Error in custom function execution:`, error);
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
        console.warn(
          `No assistant or functions found for userId: ${userId}, assistantId: ${assistantId}`,
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
      console.error(`Error getting functions list:`, error);
      return [];
    }
  }

  /**
   * Parses function calls from model output using JSON format
   * Supports both old format [FUNC:param] and new JSON format for better parameter detection
   */
  parseFunctionCall(
    text: string,
  ): { functionName: string; parameters: Record<string, any> } | null {
    // 1. Try to parse JSON format first (more reliable)
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[1]);
        if (json.function_call && json.function_call.name) {
          console.log(
            `Parsed JSON function call: ${json.function_call.name}`,
            json.function_call.parameters,
          );
          return {
            functionName: json.function_call.name.toUpperCase(),
            parameters: json.function_call.parameters || {},
          };
        }
      }
    } catch (e) {
      console.debug(`JSON parse failed, trying legacy format`);
    }

    // 2. Fallback: Parse legacy format [FUNCTION_NAME:param1, param2]
    const legacyMatch = text.match(/\[([A-Z_]+):([^\]]+)\]/);
    if (legacyMatch) {
      const functionName = legacyMatch[1];
      const parametersString = legacyMatch[2];

      // Try to split as named parameters first
      const namedParams: Record<string, any> = {};
      const paramPairs = parametersString.split(",");

      for (const pair of paramPairs) {
        const trimmed = pair.trim();
        // Check if it's key=value format
        if (trimmed.includes("=")) {
          const [key, value] = trimmed.split("=").map((s) => s.trim());
          namedParams[key] = this.coerceValue(value);
        } else {
          // Fallback: treat as positional arg
          namedParams[`arg_${Object.keys(namedParams).length}`] = trimmed;
        }
      }

      console.log(`Parsed legacy function call: ${functionName}`, namedParams);

      return {
        functionName,
        parameters: namedParams,
      };
    }

    return null;
  }

  /**
   * Coerces string values to appropriate types
   */
  private coerceValue(value: string): any {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!Number.isNaN(Number(value))) return Number(value);
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
