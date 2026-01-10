import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Replicate from "replicate";
import { encode } from "gpt-tokenizer";

@Injectable()
export class PredictionLargueService {
  private replicate: Replicate;

  private readonly MODEL_LIMIT = 16000;
  private readonly CHUNK_TOKENS = 6000;
  private readonly BUFFER = 500;

  constructor(private readonly configService: ConfigService) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>("REPLICATE_API_TOKEN"),
    });
  }

  // -------------------------
  // Token counter
  // -------------------------
  private countTokens(text: string): number {
    return encode(text).length;
  }

  // -------------------------
  // Split text by tokens
  // -------------------------
  private splitByTokens(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (this.countTokens(test) > this.CHUNK_TOKENS) {
        chunks.push(current);
        current = word;
      } else {
        current = test;
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  // -------------------------
  // Low-level single predict
  // -------------------------
  private async predictChunk(prompt: string): Promise<string> {
    const inputTokens = this.countTokens(prompt);
    const maxCompletionTokens = this.MODEL_LIMIT - inputTokens - this.BUFFER;

    if (maxCompletionTokens <= 300) {
      throw new Error("Chunk demasiado grande para procesar");
    }

    const input = {
      top_p: 1,
      prompt,
      image_input: [],
      temperature: 0.2,
      system_prompt: "Devuelve SOLO JSON válido. No expliques nada.",
      presence_penalty: 0,
      frequency_penalty: 0,
      max_completion_tokens: maxCompletionTokens,
    };

    let result = "";

    for await (const event of this.replicate.stream("openai/gpt-4.1-nano", {
      input,
    })) {
      result += event.toString();
    }

    return result.trim();
  }

  // -------------------------
  // Public method for BIG prompts
  // -------------------------
  async predictLarge(
    promptBase: string,
    fullText: string
  ): Promise<{
    output: string;
    input_tokens: number;
    output_tokens: number;
  }> {
    const chunks = this.splitByTokens(fullText);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const partialResults: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const prompt = `
${promptBase}

PARTE ${i + 1} DE ${chunks.length}
Extrae únicamente empresas que tengan al menos un correo electrónico válido.  
NO incluir ninguna empresa que no tenga al menos un correo válido.  
Salida: JSON válido, limpio y listo para procesar.  

Cada empresa debe incluir **solo** estos campos:
- empresa: nombre de la empresa
- descripcion: breve descripción, o null si no hay
- emails: lista de correos válidos, en minúsculas, sin duplicados, eliminando números iniciales y caracteres extraños.  
  Ejemplo: "25info@example.com" → "info@example.com"
- nivel_interes: "alto", "medio" o "bajo" (analiza si requieren servicios de CEO, marketing digital, desarrollo web, SEO, publicidad online, CHATBOTS, automatización de procesos o e-commerce)
- razon: breve explicación de por qué el lead es relevante

Reglas estrictas:
1. NO incluir empresas sin correos válidos.
2. Unificar empresas duplicadas.
3. Corregir emails con errores de formato (espacios, caracteres extraños).
4. Eliminar correos irreales o temporales (dominios de prueba, Wix, Sentry, GitHub, 10minutemail, mailinator, etc.).
5. No inventar datos ni rellenar campos vacíos.
6. No agregar teléfonos ni redes sociales.
7. Todos los emails en minúsculas y sin duplicados.
8. No agregar texto fuera del JSON.

Ejemplo de correo sucio y cómo debe limpiarse:
- Entrada: "25infoalfarodental@gmail.cominfoalfarodental@gmail.com"
- Salida: "infoalfarodental@gmail.com"
${chunks[i]}
`;

      totalInputTokens += this.countTokens(prompt);

      const raw = await this.predictChunk(prompt);

      totalOutputTokens += this.countTokens(raw);

      try {
        const parsed = JSON.parse(raw);
        partialResults.push(parsed);
      } catch {
        throw new Error(`JSON inválido en chunk ${i + 1}`);
      }
    }

    const merged = this.mergeResults(partialResults.flat());

    return {
      output: JSON.stringify(merged),
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
    };
  }

  // -------------------------
  // Merge & deduplicate
  // -------------------------
  private mergeResults(items: any[]): any[] {
    const map = new Map<string, any>();

    for (const item of items) {
      if (!item?.empresa) continue;

      const key = item.empresa.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          ...item,
          emails: Array.from(new Set(item.emails || [])),
          telefonos: Array.from(new Set(item.telefonos || [])),
        });
      } else {
        const existing = map.get(key);

        existing.emails = Array.from(
          new Set([...(existing.emails || []), ...(item.emails || [])])
        );

        existing.telefonos = Array.from(
          new Set([...(existing.telefonos || []), ...(item.telefonos || [])])
        );
      }
    }

    return Array.from(map.values());
  }
}
