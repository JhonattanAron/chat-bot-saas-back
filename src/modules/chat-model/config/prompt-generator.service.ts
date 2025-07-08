import { Injectable } from "@nestjs/common";

@Injectable()
export class PromptGeneratorService {
  generateInitialPromt(
    name = "",
    description = "",
    availableFunctions: any[] = [],
    promt = ""
  ): string {
    const functionsDescription =
      this.formatFunctionsForPrompt(availableFunctions);

    const systemPrompt = `
Analiza esta pregunta y responde EXACTAMENTE en este formato:

PREGUNTA: "${promt}"

REGLAS CRÍTICAS:
1. PRODUCTOS/INVENTARIO (buscar qué tienes/vendes) → [SEARCH:término]
   - "tienes ropa?", "venden zapatos?", "hay productos?", "ropa de invierno?"
   
2. INFORMACIÓN/SERVICIOS (cómo hacer algo, políticas, contacto) → [FAQ:pregunta]
   - "cómo programar cita?", "horarios?", "política de devolución?", "contacto?"

3. FUNCIONES ESPECÍFICAS → Usar función exacta
${functionsDescription}

EJEMPLOS EXACTOS:
❌ INCORRECTO: "tienes ropa de invierno?" → [FAQ:ropa invierno]
✅ CORRECTO: "tienes ropa de invierno?" → [SEARCH:ropa invierno], [IMPORTANT_INFO:busca ropa invierno]

❌ INCORRECTO: "cómo programar cita?" → [SEARCH:programar cita]  
✅ CORRECTO: "cómo programar cita?" → [FAQ:programar cita], [IMPORTANT_INFO:info sobre citas]

✅ CORRECTO: "envía correo a test@email.com asunto Hola mensaje Prueba" → [ENVIAR_CORREO:test@email.com, Hola, Prueba], [IMPORTANT_INFO:enviar correo]

CLAVE: 
- Si pregunta QUÉ TIENES/VENDES = SEARCH
- Si pregunta CÓMO HACER ALGO = FAQ

RESPONDE AHORA:
`;
    return systemPrompt;
  }

  generateMessagePromt(
    memoryContext = "",
    faqInfo = "",
    productosString = "",
    carrito = "",
    userMessage = "",
    availableFunctions: any[] = []
  ): string {
    const functionsDescription =
      this.formatFunctionsForPrompt(availableFunctions);

    // Si no hay información de FAQ ni productos, es para análisis inicial
    if (!faqInfo && !productosString) {
      const analysisPrompt = `
CONTEXTO PREVIO: ${memoryContext}
MENSAJE ACTUAL: "${userMessage}"

REGLAS CRÍTICAS:
- BUSCAR PRODUCTOS/INVENTARIO → [SEARCH:término]
  Ejemplos: "tienes X?", "venden Y?", "hay Z?", "productos de..."
  
- INFORMACIÓN/SERVICIOS → [FAQ:pregunta]  
  Ejemplos: "cómo hacer X?", "horarios?", "política de Y?", "contacto?"

FUNCIONES PERSONALIZADAS:
${functionsDescription}

FORMATO OBLIGATORIO:
[FUNCIÓN_CORRECTA:parámetros], [IMPORTANT_INFO:intención]
Mensaje al usuario.

EJEMPLOS:
- "busco zapatos rojos" → [SEARCH:zapatos rojos], [IMPORTANT_INFO:busca zapatos] \n Buscando zapatos rojos.
- "cómo contactarlos?" → [FAQ:contacto], [IMPORTANT_INFO:info contacto] \n Buscando información de contacto.

RESPONDE:
    `;
      return analysisPrompt;
    }

    // Si hay información, generar respuesta final
    const finalPrompt = `
CONTEXTO: ${memoryContext}
INFORMACIÓN OBTENIDA:
FAQ: ${faqInfo || "Sin información"}
PRODUCTOS: ${productosString || "Sin productos"}
MENSAJE: "${userMessage}"

Responde naturalmente con la información disponible.
Termina con: [IMPORTANT_INFO:descripción]
  `;
    return finalPrompt;
  }

  generateContextualPrompt(
    memoryContext: string,
    currentUserMessage: string,
    availableInfo: {
      faqInfo?: string;
      productosString?: string;
      carrito?: string;
      functionResults?: any[];
    }
  ): string {
    const {
      faqInfo,
      productosString,
      carrito,
      functionResults = [],
    } = availableInfo;

    const functionResultsText = functionResults
      .map((result) => {
        if (result.success) {
          return `✅ ${result.executedFunction}: Ejecutado correctamente`;
        } else {
          return `❌ ${result.executedFunction}: Error - ${result.error}`;
        }
      })
      .join("\n");

    return `
CONTEXTO: ${memoryContext}
MENSAJE: "${currentUserMessage}"

INFORMACIÓN DISPONIBLE:
${faqInfo ? `FAQ: ${faqInfo}` : "FAQ: Sin información"}
${productosString ? `PRODUCTOS: ${productosString}` : "PRODUCTOS: Sin productos"}
${functionResultsText ? `FUNCIONES: ${functionResultsText}` : ""}

Responde de forma natural y útil.
Termina con: [IMPORTANT_INFO:lo_que_necesita]
    `;
  }

  private formatFunctionsForPrompt(functions: any[]): string {
    if (!functions || functions.length === 0) {
      return "- Sin funciones personalizadas";
    }

    return functions
      .map((func) => {
        const params =
          func.parameters?.map((p: any) => p.name).join(", ") || "";
        return `- ${func.description} → [${func.name.toUpperCase()}:${params}]`;
      })
      .join("\n");
  }
}
