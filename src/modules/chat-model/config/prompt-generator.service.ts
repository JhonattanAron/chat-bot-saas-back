import { Injectable } from "@nestjs/common";
import { FunctionSchema } from "../model-ai/function-router.service";

@Injectable()
export class PromptGeneratorService {
  /**
   * Generates optimized prompt using new architecture
   * - Includes only essential function definitions
   * - Uses JSON schema format for better parameter extraction
   * - Minimal instructions to save tokens
   */
  generateOptimizedPrompt(
    assistantName: string,
    assistantDescription: string,
    userMessage: string,
    memoryContext: string,
    functionSchemas: FunctionSchema[],
    detectedIntent?: string,
    functionResult?: any
  ): string {
    const functionsJson = this.generateFunctionJSON(functionSchemas);
    
    let prompt = `You are ${assistantName}. ${assistantDescription}.

${memoryContext ? `Previous Context: ${memoryContext}\n` : ""}

User: "${userMessage}"

${
  functionResult
    ? `
Function Result: ${JSON.stringify(functionResult, null, 2)}

Task: Generate a natural response using the function result above.`
    : ""
}

Available Functions:
${functionsJson}

Guidelines:
- ${detectedIntent === "function_call" ? "Call a function using JSON format if needed." : "Respond naturally."}
- Keep response concise.
- Return function calls in this format:
\`\`\`json
{
  "function_call": {
    "name": "FUNCTION_NAME",
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
\`\`\``;

    return prompt;
  }

  /**
   * Legacy method - maintained for backwards compatibility
   */
  generateUnifiedPrompt(
    assistantName: string,
    assistantDescription: string,
    memoryContext: string,
    userMessage: string,
    availableFunctions: any[],
    functionResults?: any[]
  ): string {
    const functionsDescription =
      this.formatFunctionsForPrompt(availableFunctions);

    const functionResultsText = functionResults?.length
      ? functionResults
          .map((r) =>
            r.success
              ? `✔ ${r.executedFunction}: ${JSON.stringify(r.result)}`
              : `✖ ${r.executedFunction}: ${r.error}`
          )
          .join("\n")
      : "NINGUNA";

    return `
Eres ${assistantName}, ${assistantDescription}.

====================
CONTEXTO PREVIO:
${memoryContext || "No hay conversación previa."}

MENSAJE DEL USUARIO:
"${userMessage}"

====================
FUNCIONES DISPONIBLES:
${functionsDescription}

====================
RESULTADOS DE FUNCIONES (si existen):
${functionResultsText}

====================
INSTRUCCIONES CRÍTICAS:

1️⃣ Si el mensaje del usuario requiere información externa o acción:
→ LLAMA la función correcta usando el formato:
[FUNCION:parámetros]

2️⃣ Si llamas una función:
- Si la función es **IMPORTANT_INFO**, el asistente **siempre debe generar una respuesta legible** basada en la intención, incluso si no hay datos previos.
- Para todas las demás funciones que devuelven datos externos, **NO respondas al usuario aún**. Espera a que la función termine y usa sus resultados para generar la respuesta.
- Siempre termina con: [IMPORTANT_INFO:descripción clara de la intención]

3️⃣ Si YA existen resultados de funciones:
- Usa esos resultados
- Responde de forma natural al usuario
- NO vuelvas a llamar funciones

4️⃣ SIEMPRE termina con:
[IMPORTANT_INFO:resumen_claro]

⚠️ Nunca mezcles texto natural con llamadas de función.
⚠️ Usa SOLO los formatos indicados.

====================
RESPUESTA OBLIGATORIA:
⚠️ EL MODELO DEBE GENERAR UNA RESPUESTA LEGIBLE **si la función es IMPORTANT_INFO**, aunque no haya resultados previos.
⚠️ Para otras funciones, espera a los resultados antes de responder.
[IMPORTANT_INFO:respuesta generada]
`;
  }

  /**
   * Generates JSON schema format for functions (new format)
   */
  private generateFunctionJSON(schemas: FunctionSchema[]): string {
    if (schemas.length === 0) {
      return "[]";
    }

    const functionsArray = schemas.map((schema) => ({
      name: schema.name,
      description: schema.description,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          schema.parameters.map((param) => [
            param.name,
            {
              type: param.type,
              description: param.description,
              enum: param.enum,
            },
          ])
        ),
        required: schema.parameters
          .filter((p) => p.required)
          .map((p) => p.name),
      },
      returns: schema.returnType,
    }));

    return `\`\`\`json
${JSON.stringify(functionsArray, null, 2)}
\`\`\``;
  }

  private formatFunctionsForPrompt(functions: any[]): string {
    if (!functions || functions.length === 0) {
      return "- No hay funciones disponibles.";
    }

    return functions
      .map((func) => {
        const params = func.parameters?.length
          ? func.parameters.map((p: any) => p.name).join(", ")
          : "parámetros";

        return `- ${func.description}
  → Usa: [${func.name.toUpperCase()}:${params}]`;
      })
      .join("\n");
  }
}

