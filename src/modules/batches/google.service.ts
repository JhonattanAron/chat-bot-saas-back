import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class GoogleService {
  private apiKey = process.env.GOOGLE_CSE_API_KEY;
  private cseId = process.env.GOOGLE_CSE_ID;

  async search(query: string, num = 100) {
    console.log("Using KEY:", this.apiKey);
    console.log("Using CSE:", this.cseId);
    console.log(query);

    const url = "https://www.googleapis.com/customsearch/v1";

    try {
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          cx: this.cseId,
          q: query,
          num,
        },
      });

      console.log("Google API RAW response:", response.data);

      if (!response.data.items) {
        console.warn("⚠ Google returned no items");
        return [];
      }

      return response.data.items.map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      }));
    } catch (error) {
      console.error("Google search error:", error.response?.data || error);
      return [];
    }
  }
}
