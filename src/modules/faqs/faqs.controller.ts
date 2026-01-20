import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { FaqItem } from "./schema/faqs.schema";
import { FaqsService } from "./faqs.service";

@Controller("faqs")
export class FaqsController {
  constructor(private readonly faqservice: FaqsService) {}

  @Get("search")
  async searchFaqs(
    @Query("query") query: string,
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string
  ) {
    return this.faqservice.search(query, user_id, assistant_id);
  }

  @Post()
  async createFaqs(
    @Body() body: { user_id: string; assistant_id: string; faqs: FaqItem[] }
  ) {
    return this.faqservice.createFaqs(body);
  }

  @Get()
  async getFaqs(
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string
  ) {
    return this.faqservice.getFaqs(user_id, assistant_id);
  }

  @Put()
  async updateFaq(
    @Body()
    body: {
      user_id: string;
      assistant_id: string;
      faqId: string;
      update: Partial<FaqItem>;
    }
  ) {
    return this.faqservice.updateFaq(
      body.user_id,
      body.assistant_id,
      body.faqId,
      body.update
    );
  }

  @Delete()
  async deleteFaq(
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id: string,
    @Query("faqId") faqId: string
  ) {
    return this.faqservice.deleteFaq(user_id, assistant_id, faqId);
  }
}
