import { ConfigService } from "@nestjs/config";
export declare class PredictionService {
    private readonly configService;
    private openrouter;
    constructor(configService: ConfigService);
    private countTokens;
    predict(prompt: string): Promise<any>;
}
