"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let GoogleService = class GoogleService {
    constructor() {
        this.apiKey = process.env.GOOGLE_CSE_API_KEY;
        this.cseId = process.env.GOOGLE_CSE_ID;
    }
    async search(query, num = 100) {
        const results = [];
        const maxPerPage = 10;
        let startIndex = 1;
        while (results.length < num) {
            const remaining = num - results.length;
            const perPage = remaining > maxPerPage ? maxPerPage : remaining;
            try {
                const response = await axios_1.default.get("https://www.googleapis.com/customsearch/v1", {
                    params: {
                        key: this.apiKey,
                        cx: this.cseId,
                        q: query,
                        start: startIndex,
                        num: perPage,
                    },
                });
                if (!response.data.items)
                    break;
                results.push(...response.data.items.map((item) => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet,
                })));
                startIndex += maxPerPage;
            }
            catch (error) {
                console.error("Google search error:", error.response?.data || error);
                break;
            }
        }
        return results;
    }
};
exports.GoogleService = GoogleService;
exports.GoogleService = GoogleService = __decorate([
    (0, common_1.Injectable)()
], GoogleService);
//# sourceMappingURL=google.service.js.map