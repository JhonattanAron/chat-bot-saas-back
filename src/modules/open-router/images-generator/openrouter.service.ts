import { Injectable } from "@nestjs/common";
import { OpenRouter } from "@openrouter/sdk";

type ReferenceImage = {
  url: string;
  role: string; // textura | forma | color | estilo | etc
};

@Injectable()
export class OpenRouterService {
  private openrouter: OpenRouter;

  constructor() {
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  // 🔥 Builder de prompt inteligente
  private buildStructuredPrompt(
    prompt: string,
    references: ReferenceImage[],
  ): string {
    if (!references?.length) return prompt;

    const intro = references
      .map((ref, i) => `Imagen ${i + 1}: referencia de ${ref.role}`)
      .join("\n");

    const instructions = references
      .map((ref, i) => `- Usa la ${ref.role} de la imagen ${i + 1}`)
      .join("\n");

    return `
${prompt}

Referencias:
${intro}

Instrucciones:
${instructions}
- No mezclar estilos
- Mantener coherencia visual
- Alta calidad
`;
  }

  async generateImage(prompt: string, referenceImages?: ReferenceImage[]) {
    // 🔒 limitamos a 3 (recomendado)
    const images = referenceImages?.slice(0, 3) || [];

    const structuredPrompt = this.buildStructuredPrompt(prompt, images);

    const body: any = {
      model: "black-forest-labs/flux.2-klein-4b",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: structuredPrompt,
            },
            ...images.map((ref) => ({
              type: "image_url",
              image_url: { url: ref.url },
            })),
          ],
        },
      ],
    };
    console.log({ "api-key": process.env.OPENROUTER_API_KEY });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log("STRUCTURED PROMPT:", structuredPrompt);
    console.log("RAW RESPONSE:", data);

    return data;
  }
}
