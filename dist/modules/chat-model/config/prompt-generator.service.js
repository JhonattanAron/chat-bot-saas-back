"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptGeneratorService = void 0;
const common_1 = require("@nestjs/common");
let PromptGeneratorService = class PromptGeneratorService {
    generateUnifiedPrompt(assistantName, assistantDescription, memoryContext, userMessage, availableFunctions, functionResults) {
        const functionsDescription = this.formatFunctionsForPrompt(availableFunctions);
        const functionResultsText = functionResults?.length
            ? functionResults
                .map((r) => r.success
                ? `✔ ${r.executedFunction}: ${JSON.stringify(r.result)}`
                : `✖ ${r.executedFunction}: ${r.error}`)
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
    formatFunctionsForPrompt(functions) {
        if (!functions || functions.length === 0) {
            return "- No hay funciones disponibles.";
        }
        return functions
            .map((func) => {
            const params = func.parameters?.length
                ? func.parameters.map((p) => p.name).join(", ")
                : "parámetros";
            return `- ${func.description}
  → Usa: [${func.name.toUpperCase()}:${params}]`;
        })
            .join("\n");
    }
};
exports.PromptGeneratorService = PromptGeneratorService;
exports.PromptGeneratorService = PromptGeneratorService = __decorate([
    (0, common_1.Injectable)()
], PromptGeneratorService);
//# sourceMappingURL=prompt-generator.service.js.map