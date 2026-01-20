import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenRouter } from "@openrouter/sdk";
import { encode } from "gpt-tokenizer";

@Injectable()
export class PredictionService {
  private openrouter: OpenRouter;

  constructor(private readonly configService: ConfigService) {
    this.openrouter = new OpenRouter({
      apiKey: this.configService.get<string>("OPENROUTER_API_KEY"),
    });
  }

  private countTokens(text: string): number {
    return encode(text).length;
  }

  async predict(prompt: string): Promise<any> {
    let result = "";
    console.log(prompt);

    const stream = await this.openrouter.chat.send({
      model: "openai/gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        result += content;
      }
    }

    const inputTokens = this.countTokens(prompt);
    const outputTokens = this.countTokens(result);
    const totalTokens = inputTokens + outputTokens;

    console.log(result);

    return {
      output: result.trim(),
      tokens: totalTokens,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    };
  }
}
