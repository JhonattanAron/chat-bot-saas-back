"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@openrouter/sdk");
const gpt_tokenizer_1 = require("gpt-tokenizer");
let PredictionService = class PredictionService {
    constructor(configService) {
        this.configService = configService;
        this.openrouter = new sdk_1.OpenRouter({
            apiKey: this.configService.get("OPENROUTER_API_KEY"),
        });
    }
    countTokens(text) {
        return (0, gpt_tokenizer_1.encode)(text).length;
    }
    async predict(prompt) {
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
};
exports.PredictionService = PredictionService;
exports.PredictionService = PredictionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PredictionService);
//# sourceMappingURL=predictions.service.js.map