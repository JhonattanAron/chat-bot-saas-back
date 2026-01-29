import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenRouter } from "@openrouter/sdk";

@Injectable()
export class PredictionService {
  private openrouter: OpenRouter;

  constructor(private readonly configService: ConfigService) {
    this.openrouter = new OpenRouter({
      apiKey: this.configService.get<string>("OPENROUTER_API_KEY"),
    });
  }

  private extractText(
    content: string | { type: string; text?: string }[] | null | undefined,
  ): string {
    if (!content) return "";

    if (typeof content === "string") {
      return content;
    }

    return content
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("");
  }

  async predict(prompt: string) {
    const completion = await this.openrouter.chat.send({
      model: "openai/gpt-4.1-nano",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      maxTokens: 512,
      temperature: 0.7,
    });

    // ✅ AQUÍ está la respuesta real del modelo
    const message = completion.choices?.[0]?.message;
    const output = String(this.extractText(message?.content));

    const usage = completion.usage;

    // ⚠️ nombres correctos (snake_case)
    const inputTokens = usage?.promptTokens ?? 0;
    const outputTokens = usage?.completionTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      output: output.trim(),
      tokens: totalTokens,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    };
  }
}
