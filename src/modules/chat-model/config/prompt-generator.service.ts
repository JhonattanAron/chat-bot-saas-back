import { Injectable } from "@nestjs/common";

@Injectable()
export class PromptGeneratorService {
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
- NO respondas al usuario aún
- SOLO devuelve el llamado de función y:
  [IMPORTANT_INFO:descripción clara de la intención]

3️⃣ Si YA existen resultados de funciones:
- Usa esos resultados
- Responde de forma natural al usuario
- NO vuelvas a llamar funciones

4️⃣ SIEMPRE termina con:
[IMPORTANT_INFO:resumen_claro]

⚠️ Nunca mezcles texto natural con llamadas de función.
⚠️ Usa SOLO los formatos indicados.

====================
RESPUESTA:
`;
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
