"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbedding = getEmbedding;
exports.cosineSimilarity = cosineSimilarity;
const transformers_1 = require("@xenova/transformers");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let embedder = null;
function modelExists(cacheDir) {
    try {
        const fullPath = path.resolve(cacheDir);
        return fs.existsSync(fullPath) && fs.readdirSync(fullPath).length > 0;
    }
    catch {
        return false;
    }
}
async function getEmbedding(text) {
    if (!embedder) {
        const cacheDir = "./models_cache";
        if (!modelExists(cacheDir)) {
            throw new Error(`Modelo no encontrado en '${cacheDir}'. Descarga el modelo manualmente antes de usar.`);
        }
        console.log("Cargando modelo SOLO desde cache...");
        embedder = await (0, transformers_1.pipeline)("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
            cache_dir: cacheDir,
            local_files_only: true,
        });
        console.log("Modelo cargado desde cache.");
    }
    else {
        console.log("Usando modelo ya cargado.");
    }
    const result = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(result.data);
}
function cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
    return dot / (normA * normB);
}
//# sourceMappingURL=embedding.js.map