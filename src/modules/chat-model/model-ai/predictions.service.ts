import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Replicate from "replicate";

@Injectable()
export class PredictionService {
  private replicate: Replicate;

  constructor(private readonly configService: ConfigService) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>("REPLICATE_API_TOKEN"),
    });
  }

  async predict(prompt: string): Promise<any> {
    const input = {
      top_p: 1,
      prompt,
      image_input: [],
      temperature: 1,
      system_prompt: "You are a helpful assistant.",
      presence_penalty: 0,
      frequency_penalty: 0,
      max_completion_tokens: 4096,
    };

    let result = "";

    for await (const event of this.replicate.stream("openai/gpt-4.1-nano", {
      input,
    })) {
      result += event.toString();
    }

    return {
      output: result.trim(),
      tokens: 0,
      input_tokens: 0,
      output_tokens: 0,
    };
  }
}
