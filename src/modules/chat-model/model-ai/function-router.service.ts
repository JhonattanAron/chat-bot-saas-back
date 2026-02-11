import { Injectable, Logger } from "@nestjs/common";

export interface FunctionSchema {
  name: string;
  description: string;
  category: "system" | "custom" | "api";
  parameters: {
    name: string;
    type: "string" | "number" | "boolean" | "array";
    description: string;
    required: boolean;
    enum?: string[];
  }[];
  returnType: string;
}

export interface IntentMatch {
  intentType: "function_call" | "search" | "faq" | "direct_response" | "unknown";
  confidence: number;
  functionName?: string;
  extractedParams?: Record<string, any>;
  systemFunction?: "SEARCH" | "FAQ" | "IMPORTANT_INFO";
}

@Injectable()
export class FunctionRouterService {
  private readonly logger = new Logger(FunctionRouterService.name);

  /**
   * Detects intent from user message and available functions
   * Uses pattern matching + keyword analysis instead of LLM
   */
  detectIntent(
    userMessage: string,
    availableFunctions: FunctionSchema[]
  ): IntentMatch {
    const messageUpper = userMessage.toUpperCase();
    const messageLower = userMessage.toLowerCase();

    // 1. Check for system functions first (SEARCH, FAQ)
    if (
      messageUpper.includes("BUSCAR") ||
      messageUpper.includes("SEARCH") ||
      messageUpper.includes("ENCONTRAR") ||
      messageLower.match(/busca?r?\s+(info|información|datos|producto)/i)
    ) {
      return {
        intentType: "search",
        confidence: 0.95,
        systemFunction: "SEARCH",
      };
    }

    if (
      messageUpper.includes("FAQ") ||
      messageUpper.includes("PREGUNTA") ||
      messageLower.match(/\b(how|cómo|por qué|why|cuando)\b/i)
    ) {
      return {
        intentType: "faq",
        confidence: 0.85,
        systemFunction: "FAQ",
      };
    }

    // 2. Try to match with available custom functions
    for (const func of availableFunctions) {
      const paramValues = this.extractParameterValues(userMessage, func);
      
      if (paramValues && this.isFunctionRelevant(messageLower, func)) {
        return {
          intentType: "function_call",
          confidence: 0.88,
          functionName: func.name,
          extractedParams: paramValues,
        };
      }
    }

    // 3. Check if it's a direct response question (no function needed)
    if (
      messageLower.match(
        /\b(quién|qué|dónde|cuándo|cómo|por qué|what|who|where|when|why)\b/i
      )
    ) {
      return {
        intentType: "direct_response",
        confidence: 0.70,
      };
    }

    return {
      intentType: "unknown",
      confidence: 0.0,
    };
  }

  /**
   * Validates if a function is relevant to the user message
   */
  private isFunctionRelevant(message: string, func: FunctionSchema): boolean {
    const funcNameLower = func.name.toLowerCase();
    const funcDescLower = func.description.toLowerCase();

    // Check if function name or description keywords appear in message
    const keywords = [
      ...funcNameLower.split("_"),
      ...funcDescLower.split(" "),
    ].filter((k) => k.length > 3);

    const matchCount = keywords.filter((k) => message.includes(k)).length;
    return matchCount >= 2 || message.includes(funcNameLower);
  }

  /**
   * Extracts parameter values from user message based on function schema
   */
  private extractParameterValues(
    message: string,
    func: FunctionSchema
  ): Record<string, any> | null {
    const params: Record<string, any> = {};
    let foundRequiredParams = 0;

    for (const param of func.parameters) {
      if (param.required) {
        // For required string params, use the entire message as potential value
        if (param.type === "string") {
          // Simple extraction: use words after function-related keywords
          const paramValue = this.extractParamValue(message, param);
          if (paramValue) {
            params[param.name] = paramValue;
            foundRequiredParams++;
          }
        }
      } else {
        // Optional parameters
        const paramValue = this.extractParamValue(message, param);
        if (paramValue) {
          params[param.name] = paramValue;
        }
      }
    }

    // Only return if we found required parameters
    return foundRequiredParams >= func.parameters.filter((p) => p.required).length
      ? params
      : null;
  }

  /**
   * Extracts a parameter value from message
   */
  private extractParamValue(
    message: string,
    param: {
      name: string;
      type: string;
      enum?: string[];
    }
  ): any | null {
    if (param.enum) {
      // Check if any enum value appears in message
      const foundEnum = param.enum.find((e) =>
        message.toLowerCase().includes(e.toLowerCase())
      );
      return foundEnum || null;
    }

    if (param.type === "string") {
      // Extract quoted strings or the message itself
      const quotedMatch = message.match(/"([^"]+)"|'([^']+)'/);
      if (quotedMatch) {
        return quotedMatch[1] || quotedMatch[2];
      }
      // Use entire message as parameter
      return message.length > 3 ? message : null;
    }

    if (param.type === "number") {
      const numberMatch = message.match(/\d+/);
      return numberMatch ? parseInt(numberMatch[0]) : null;
    }

    if (param.type === "boolean") {
      if (message.match(/\b(sí|yes|verdadero|true)\b/i)) return true;
      if (message.match(/\b(no|false|falso)\b/i)) return false;
    }

    return null;
  }

  /**
   * Validates function parameters before execution
   */
  validateFunctionCall(
    functionName: string,
    params: Record<string, any>,
    schema: FunctionSchema
  ): { valid: boolean; error?: string } {
    for (const paramDef of schema.parameters) {
      if (paramDef.required && !params[paramDef.name]) {
        return {
          valid: false,
          error: `Required parameter '${paramDef.name}' is missing`,
        };
      }

      if (params[paramDef.name]) {
        const value = params[paramDef.name];
        const actualType = typeof value;

        // Type validation
        if (paramDef.type === "string" && actualType !== "string") {
          return {
            valid: false,
            error: `Parameter '${paramDef.name}' must be a string`,
          };
        }

        if (paramDef.type === "number" && actualType !== "number") {
          return {
            valid: false,
            error: `Parameter '${paramDef.name}' must be a number`,
          };
        }

        // Enum validation
        if (
          paramDef.enum &&
          !paramDef.enum.includes(value as string)
        ) {
          return {
            valid: false,
            error: `Parameter '${paramDef.name}' must be one of: ${paramDef.enum.join(", ")}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Converts function schema to prompt format for LLM
   */
  formatFunctionSchemaForPrompt(functions: FunctionSchema[]): string {
    if (functions.length === 0) {
      return "No functions available.";
    }

    return functions
      .map((func) => {
        const params = func.parameters
          .map(
            (p) =>
              `${p.name}${p.required ? "*" : ""}: ${p.type}${p.enum ? ` (${p.enum.join(" | ")})` : ""}`
          )
          .join(", ");

        return `- **${func.name}** (${func.category}): ${func.description}
  Returns: ${func.returnType}
  Parameters: [${params}]`;
      })
      .join("\n");
  }
}
