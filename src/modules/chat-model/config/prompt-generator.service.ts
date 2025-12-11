import { Injectable } from "@nestjs/common"

@Injectable()
export class PromptGeneratorService {
  // Prompt para el análisis inicial de intención y función (no genera respuesta natural)
  generateAnalysisPrompt(
    contextName: string,
    contextDescription: string,
    availableFunctions: any[] = [],
    userPrompt: string,
  ): string {
    const functionsDescription = this.formatFunctionsForPrompt(availableFunctions)

    const systemPrompt = `
Eres un asistente inteligente. Tu tarea es analizar la siguiente pregunta del usuario y determinar la INTENCIÓN principal.
Basado en la intención, debes identificar si se necesita ejecutar una función (SEARCH, FAQ, o una función personalizada).

Responde EXCLUSIVAMENTE en el siguiente formato, sin añadir ningún otro texto:
[FUNCIÓN_IDENTIFICADA:parámetros], [IMPORTANT_INFO:descripción_corta_de_la_intención_o_acción]

REGLAS CRÍTICAS PARA LA FUNCIÓN_IDENTIFICADA:
1. **BÚSQUEDA DE PRODUCTOS/INVENTARIO**: Si el usuario pregunta sobre qué tienes, qué vendes, disponibilidad de productos, etc.
   → Usa: [SEARCH:término_de_búsqueda]
   **Optimiza el query de búsqueda, extrayendo palabras clave relevantes o sinónimos para mejorar la precisión.**
   Ejemplos:
   - "tienes ropa?" → [SEARCH:ropa], [IMPORTANT_INFO:busca ropa]
   - "venden zapatos?" → [SEARCH:zapatos], [IMPORTANT_INFO:busca zapatos]
   - "ropa para el frío" → [SEARCH:chaquetas invierno], [IMPORTANT_INFO:busca ropa de invierno]

2. **INFORMACIÓN GENERAL/SERVICIOS (FAQs)**: Si el usuario pregunta cómo hacer algo, sobre políticas, horarios, contacto, etc.
   → Usa: [FAQ:pregunta_específica_para_FAQ]
   Ejemplos:
   - "cómo programar cita?" → [FAQ:programar cita], [IMPORTANT_INFO:info sobre citas]
   - "horarios?" → [FAQ:horarios], [IMPORTANT_INFO:consulta horarios]

3. **FUNCIONES PERSONALIZADAS**: Si la intención del usuario coincide con una de las funciones disponibles.
   **Asegúrate de que los parámetros sean específicos y relevantes para la función.**
   **Los parámetros deben ser extraídos de la pregunta del usuario y listados en el orden correcto, separados por comas (,) dentro del corchete.**

${functionsDescription}

EJEMPLOS DE RESPUESTA:
- Usuario: "busco zapatos rojos"
  Respuesta: [SEARCH:zapatos rojos], [IMPORTANT_INFO:busca zapatos]
- Usuario: "cómo contactarlos?"
  Respuesta: [FAQ:contacto], [IMPORTANT_INFO:info contacto]
- Usuario: "dime el clima de hoy en Madrid"
  Respuesta: [OBTENER_CLIMA:Madrid], [IMPORTANT_INFO:consulta clima Madrid]
- Usuario: "envía un correo a soporte@ejemplo.com con el asunto 'Problema' y el mensaje 'Mi producto no funciona'"
  Respuesta: [ENVIAR_CORREO:soporte@ejemplo.com, Problema, Mi producto no funciona], [IMPORTANT_INFO:enviar correo de soporte]

CLAVE:
- Si la intención es QUÉ TIENES/VENDES = SEARCH
- Si la intención es CÓMO HACER ALGO = FAQ
- Si la intención es una ACCIÓN ESPECÍFICA = FUNCIÓN PERSONALIZADA

PREGUNTA DEL USUARIO: "${userPrompt}"

RESPUESTA (SOLO EL FORMATO REQUERIDO):
`
    return systemPrompt
  }

  // Prompt para generar la respuesta natural final al usuario
  generateContextualPrompt(
    assistantName: string,
    assistantDescription: string,
    memoryContext: string,
    currentUserMessage: string,
    availableInfo: {
      faqInfo?: string
      productosString?: string
      carrito?: string
      functionResults?: any[]
    },
  ): string {
    const { faqInfo, productosString, carrito, functionResults = [] } = availableInfo

    const functionResultsText = functionResults
      .map((result) => {
        if (result.success) {
          return `✅ Función '${result.executedFunction}' ejecutada con éxito. Resultado: ${JSON.stringify(result.result)}`
        } else {
          return `❌ Función '${result.executedFunction}' falló. Error: ${result.error}`
        }
      })
      .join("\n")

    let productResponseInstruction = ""
    const noProductsFound = productosString === "No se encontraron productos con ese término."
    const generalProductInquiryWithoutSearch =
      !productosString &&
      currentUserMessage.toLowerCase().includes("productos") &&
      !functionResults.some((f) => f.executedFunction.includes("SEARCH"))

    if (noProductsFound || generalProductInquiryWithoutSearch) {
      productResponseInstruction = `
- Si la búsqueda de productos no arrojó resultados o el usuario preguntó por productos en general sin especificar, NO digas 'no tengo información' o 'no hay productos'. En su lugar, como ${assistantName}, pregunta al usuario qué tipo de producto específico está buscando o qué características le interesan para poder realizar una búsqueda más precisa.
- Ejemplo: "No encontré productos con esa descripción. Como tu asistente de compras, puedo ayudarte a buscar algo específico. ¿Qué tipo de producto te gustaría encontrar o qué características buscas?"
- Ejemplo para pregunta general: "Claro, como tu asistente de compras, puedo ayudarte a encontrar lo que necesitas. ¿Qué tipo de producto te gustaría encontrar o qué características buscas?"
`
    }

    return `
Eres ${assistantName}, un asistente de ${assistantDescription}.
CONTEXTO DE CONVERSACIÓN PREVIA: ${memoryContext}
MENSAJE ACTUAL DEL USUARIO: "${currentUserMessage}"

INFORMACIÓN RECOPILADA PARA LA RESPUESTA:
${faqInfo ? `INFORMACIÓN DE FAQ: ${faqInfo}` : "INFORMACIÓN DE FAQ: No se encontró información relevante."}
${productosString ? `PRODUCTOS ENCONTRADOS: ${productosString}` : "PRODUCTOS ENCONTRADOS: No se encontraron productos."}
${functionResultsText ? `RESULTADOS DE FUNCIONES EJECUTADAS:\n${functionResultsText}` : "FUNCIONES EJECUTADAS: Ninguna."}

Instrucciones para la respuesta:
- Responde de forma natural, amigable y útil al usuario, utilizando la información recopilada y tu rol como ${assistantName}.
- Si se ejecutó una función, menciona el resultado de manera concisa.
- Si no se encontró información relevante (FAQ o Productos), informa al usuario de manera cortés.
${productResponseInstruction}
- NO incluyas los tags [SEARCH:...], [FAQ:...], [ENVIAR_CORREO:...], etc., en tu respuesta final.
- Termina tu respuesta con un tag [IMPORTANT_INFO:resumen_claro_de_la_respuesta_o_acción_principal]. Este resumen es para el sistema, no para el usuario.

RESPUESTA AL USUARIO:
`
  }

  // Este método solo llama a generateAnalysisPrompt. Puede eliminarse o refactorizarse.
  generateMessagePrompt(
    memoryContext = "",
    faqInfo = "",
    productosString = "",
    carrito = "",
    userMessage = "",
    availableFunctions: any[] = [],
  ): string {
    return this.generateAnalysisPrompt("Asistente", "Asistente de chat", availableFunctions, userMessage)
  }

  // Formatea la descripción de las funciones disponibles
  private formatFunctionsForPrompt(functions: any[]): string {
    if (!functions || functions.length === 0) {
      return "- No hay funciones personalizadas disponibles."
    }

    return functions
      .map((func) => {
        let parametersList = ""

        if (func.parameters && Array.isArray(func.parameters) && func.parameters.length > 0) {
          // Para funciones API, los parámetros tienen estructura {name, type, required}
          parametersList = func.parameters.map((p: any) => p.name || p).join(", ")
        } else if (func.type === "custom") {
          // Para funciones custom sin parámetros definidos, mostrar placeholder genérico
          parametersList = "parámetros_si_necesarios"
        }

        const functionDescription = func.description || `Función ${func.name}`

        return `- **${functionDescription}**\n  → Usa: [${func.name.toUpperCase()}${parametersList ? ":" + parametersList : ""}]`
      })
      .join("\n\n")
  }
}
