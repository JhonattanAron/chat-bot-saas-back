import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class GoogleService {
  private apiKey = process.env.GOOGLE_CSE_API_KEY;
  private cseId = process.env.GOOGLE_CSE_ID;

  async search(query: string, num = 100) {
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const maxPerPage = 10;
    let startIndex = 1;
    console.log(query);

    while (results.length < num) {
      const remaining = num - results.length;
      const perPage = remaining > maxPerPage ? maxPerPage : remaining;

      try {
        const response = await axios.get(
          "https://www.googleapis.com/customsearch/v1",
          {
            params: {
              key: this.apiKey,
              cx: this.cseId,
              q: query,
              start: startIndex,
              num: perPage,
            },
          },
        );

        if (!response.data.items) break;

        results.push(
          ...response.data.items.map((item) => ({
            title: item.title,
            url: item.link,
            snippet: item.snippet,
          })),
        );

        startIndex += maxPerPage;
      } catch (error) {
        console.error("Google search error:", error.response?.data || error);
        break;
      }
    }

    return results;
  }
}
