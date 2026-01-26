import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";

interface GoogleSearchOptions {
  lang?: string; // ej: "es"
  country?: string; // ej: "ec"
  safe?: "active" | "off";
}

interface GoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
}

@Injectable()
export class GoogleService {
  private readonly apiKey = process.env.GOOGLE_CSE_API_KEY;
  private readonly cx = "017576662512468239146:omuauf_lfve";

  private readonly MAX_RESULTS = 100;
  private readonly MAX_PER_PAGE = 10;
  private readonly MAX_START_INDEX = 91;

  async search(
    query: string,
    num = 10,
    options?: GoogleSearchOptions,
  ): Promise<GoogleSearchResult[]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        "Google CSE API key not configured",
      );
    }
    if (!query || !query.trim()) return [];

    const requested = Math.min(num, this.MAX_RESULTS);
    const results: GoogleSearchResult[] = [];
    let startIndex = 1;

    while (results.length < requested && startIndex <= this.MAX_START_INDEX) {
      const remaining = requested - results.length;
      const perPage = Math.min(remaining, this.MAX_PER_PAGE);

      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(
          query,
        )}&start=${startIndex}&num=${perPage}${
          options?.lang ? `&lr=lang_${options.lang}` : ""
        }${options?.country ? `&cr=country${options.country.toUpperCase()}` : ""}${
          options?.safe ? `&safe=${options.safe}` : ""
        }`;

        const response = await axios.get(url);

        const items = response.data?.items;
        if (!items || items.length === 0) break;

        results.push(
          ...items.map((item: any) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet,
          })),
        );

        startIndex += this.MAX_PER_PAGE;
      } catch (error: any) {
        console.error(
          "Google search error:",
          error.response?.data || error.message,
        );
        break; // Salimos si hay error
      }
    }

    return results;
  }
}
