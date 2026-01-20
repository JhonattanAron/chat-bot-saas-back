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
exports.PredictionLargueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@openrouter/sdk");
const gpt_tokenizer_1 = require("gpt-tokenizer");
let PredictionLargueService = class PredictionLargueService {
    constructor(configService) {
        this.configService = configService;
        this.MODEL_LIMIT = 16000;
        this.CHUNK_TOKENS = 6000;
        this.BUFFER = 500;
        this.openrouter = new sdk_1.OpenRouter({
            apiKey: this.configService.get("OPENROUTER_API_KEY"),
        });
    }
    countTokens(text) {
        return (0, gpt_tokenizer_1.encode)(text).length;
    }
    splitByTokens(text) {
        const words = text.split(/\s+/);
        const chunks = [];
        let current = "";
        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (this.countTokens(test) > this.CHUNK_TOKENS) {
                chunks.push(current);
                current = word;
            }
            else {
                current = test;
            }
        }
        if (current)
            chunks.push(current);
        return chunks;
    }
    async predictChunk(prompt) {
        const inputTokens = this.countTokens(prompt);
        const maxCompletionTokens = this.MODEL_LIMIT - inputTokens - this.BUFFER;
        if (maxCompletionTokens <= 300) {
            throw new Error("Chunk demasiado grande para procesar");
        }
        let result = "";
        const stream = await this.openrouter.chat.send({
            model: "openai/gpt-4.1-nano",
            stream: true,
            messages: [
                {
                    role: "system",
                    content: "Devuelve SOLO JSON válido. No expliques nada.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            maxTokens: maxCompletionTokens,
        });
        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content)
                result += content;
        }
        return result.trim();
    }
    async predictLarge(promptBase, fullText) {
        const chunks = this.splitByTokens(fullText);
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        const partialResults = [];
        for (let i = 0; i < chunks.length; i++) {
            const prompt = `
${promptBase}

PARTE ${i + 1} DE ${chunks.length}
Extrae únicamente empresas que tengan al menos un correo electrónico válido.
NO incluir ninguna empresa que no tenga al menos un correo válido.
Salida: JSON válido, limpio y listo para procesar.

Cada empresa debe incluir **solo** estos campos:
- empresa
- descripcion
- emails
- nivel_interes
- razon

Reglas estrictas:
1. NO incluir empresas sin correos válidos.
2. Unificar empresas duplicadas.
3. Corregir emails con errores de formato.
4. Eliminar correos irreales o temporales.
5. No inventar datos.
6. No agregar teléfonos ni redes sociales.
7. Emails en minúsculas y sin duplicados.
8. No agregar texto fuera del JSON.

Ejemplo limpieza:
Entrada: "25infoalfarodental@gmail.cominfoalfarodental@gmail.com"
Salida: "infoalfarodental@gmail.com"

${chunks[i]}
`;
            totalInputTokens += this.countTokens(prompt);
            const raw = await this.predictChunk(prompt);
            totalOutputTokens += this.countTokens(raw);
            try {
                const parsed = JSON.parse(raw);
                partialResults.push(parsed);
            }
            catch {
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
    mergeResults(items) {
        const map = new Map();
        for (const item of items) {
            if (!item?.empresa)
                continue;
            const key = item.empresa.toLowerCase().trim();
            if (!map.has(key)) {
                map.set(key, {
                    ...item,
                    emails: Array.from(new Set(item.emails || [])),
                });
            }
            else {
                const existing = map.get(key);
                existing.emails = Array.from(new Set([...(existing.emails || []), ...(item.emails || [])]));
            }
        }
        return Array.from(map.values());
    }
};
exports.PredictionLargueService = PredictionLargueService;
exports.PredictionLargueService = PredictionLargueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PredictionLargueService);
//# sourceMappingURL=predictionlargue.service.js.map