// src/utils/embedding.ts
import { pipeline } from "@xenova/transformers";
import * as fs from "fs";
import * as path from "path";

let embedder: any = null;

// Verifica que la carpeta del modelo exista antes de cargar
function modelExists(cacheDir: string): boolean {
  try {
    const fullPath = path.resolve(cacheDir);
    return fs.existsSync(fullPath) && fs.readdirSync(fullPath).length > 0;
  } catch {
    return false;
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (!embedder) {
    const cacheDir = "./models_cache";
    if (!modelExists(cacheDir)) {
      throw new Error(
        `Modelo no encontrado en '${cacheDir}'. Descarga el modelo manualmente antes de usar.`
      );
    }
    console.log("Cargando modelo SOLO desde cache...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      cache_dir: cacheDir,
      // No agregamos progress_callback para evitar intentar descargar
      local_files_only: true, // IMPORTANTE: Solo carga archivos locales, NO descargar
    });
    console.log("Modelo cargado desde cache.");
  } else {
    console.log("Usando modelo ya cargado.");
  }

  const result = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (normA * normB);
}
