import { ConfigService } from "@nestjs/config";
export declare class PredictionLargueService {
    private readonly configService;
    private openrouter;
    private readonly MODEL_LIMIT;
    private readonly CHUNK_TOKENS;
    private readonly BUFFER;
    constructor(configService: ConfigService);
    private countTokens;
    private splitByTokens;
    private predictChunk;
    predictLarge(promptBase: string, fullText: string): Promise<{
        output: string;
        input_tokens: number;
        output_tokens: number;
    }>;
    private mergeResults;
}
