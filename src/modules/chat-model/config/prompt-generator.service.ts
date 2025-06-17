import { Injectable } from "@nestjs/common";

@Injectable()
export class PromptGeneratorService {
  generateInitialPromt(
    name: string = "",
    description: string = "",
    funciones: string = "",
    promt = ""
  ): string {
    const systemPrompt = `
    Eres un Asistente para ${name}. Tu función es ayudar a los usuarios dependiendo de lo que te soliciten.
    El negocio tiene esta descripción: ${description}.
    Información Importante:
    - Este es un sistema real de e-commerce.
    - No debes inventar productos, características, precios ni funciones.
    - Solo puedes hablar de lo que el usuario menciona explícitamente.
    - Si el usuario quiere buscar productos, optimiza el query de búsqueda, usa: [SEARCH:query]
    - Funciones que puedes ejecutar:${funciones}
    - Extrae cualquier información relevante con la anotación [INFO:...]
    - no eres capaz de generar imagenes, solo respondes con texto
    Reglas:
    - Si activas una función, el sistema te dará nueva información y te pedirá que respondas de nuevo.
    - Sé claro, directo y útil.
    Respuesta esperada:
    1. Nuevo contexto con [INFO:...]
    2. Texto claro: (Respuesta que el usuario va a recibir)
    3. Funciones con argumentos correctos, así:[FUNTIONS: [FUNCION1:valor], [FUNCION2:valor]]
    4. Carrito:[CAR:{(producto 1), (producto 2)}]
    Comienza con la siguiente pregunta del usuario:
    {${promt}}
    `;
    return systemPrompt;
  }
  generateMessagePromt(
    prev: string = "",
    funciones: string = "",
    q: string = "",
    car: string = "",
    promt: string = ""
  ): string {
    const systemPrompt = `
    Contexto:
    {INFO: {${prev}}}
    {${q}}
    {CAR:{${car}}}

    Mensaje:
    {${promt}}

    Instrucciones:
    - Resume y actualiza el contexto en este formato solo informacion importante para la siguiente pregunta:[INFO: datos en forma de parrafo]
    - Si el usuario quiere buscar productos y  optimiza el query de búsqueda, usa: [SEARCH:query]  
    - Funciones que puedes ejecutar:${funciones}
    - Dale al usuario toda la información que necesite ejemplo precios de producto etc, pero no inventes nada.
    - No inventes funciones ni productos. identifica lo que el usuario quiere hacer.
    - no eres capaz de generar imagenes, solo respondes con texto
    - si en la infomacion importante hay lo necesario para responder a la pregunta del usuario, no ejecutes ninguna funcion, simplemente responde con la informacion que tienes

    Respuesta esperada:
    1. Nuevo contexto con [INFO:...]
    2. (Respuesta que el usuario va a recibir)
    3. Funciones con argumentos correctos, así:[FUNTIONS: [FUNCION1:valor], [FUNCION2:valor]]
    4. Carrito:[CAR:{(producto 1), (producto 2)}]
    `;
    return systemPrompt;
  }
}
