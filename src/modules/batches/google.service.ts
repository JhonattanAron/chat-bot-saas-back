import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class GoogleService {
  private readonly apiKey = process.env.GOOGLE_CSE_API_KEY;
  private readonly cseId = process.env.GOOGLE_CSE_ID;

  private readonly BASE_URL = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_API_KEY}&cx=017576662512468239146:omuauf_lfve&q=lectures`;
  private readonly MAX_RESULTS = 100; // límite total real
  private readonly MAX_PER_PAGE = 10; // máximo permitido por request
  private readonly MAX_START_INDEX = 91; // start + num <= 101

  /**
   * Búsqueda en Google Programmable Search
   */
  async search(
    query: string,
    num = 10,
    options?: {
      lang?: string; // lang_es
      country?: string; // ec
      safe?: "active" | "off";
    },
  ): Promise<Array<{ title: string; url: string; snippet: string }>> {
    // 🔒 VALIDACIONES BÁSICAS
    if (!this.apiKey || !this.cseId) {
      throw new InternalServerErrorException(
        "Google CSE API key or Search Engine ID not configured",
      );
    }

    if (!query || !query.trim()) {
      return [];
    }

    // 🔢 Google NO permite más de 100 resultados
    const requested = Math.min(num, this.MAX_RESULTS);

    const results: Array<{ title: string; url: string; snippet: string }> = [];

    let startIndex = 1;

    // 🚫 start nunca puede ser > 91
    while (results.length < requested && startIndex <= this.MAX_START_INDEX) {
      const remaining = requested - results.length;
      const perPage =
        remaining > this.MAX_PER_PAGE ? this.MAX_PER_PAGE : remaining;

      try {
        const response = await axios.get(this.BASE_URL);

        const items = response.data?.items;

        // ❌ No más resultados
        if (!items || items.length === 0) {
          break;
        }

        // ✅ Normalizar resultados
        results.push(
          ...items.map((item: any) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet,
          })),
        );

        // ➕ Avanzar página (siempre de 10)
        startIndex += this.MAX_PER_PAGE;
      } catch (error: any) {
        console.error(
          "Google search error:",
          error.response?.data || error.message,
        );
        break;
      }
    }

    return results;
  }
}
