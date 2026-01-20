import { Module } from "@nestjs/common";
import { FaqsController } from "./faqs.controller";
import { FaqsService } from "./faqs.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Faqs, FaqsSchema } from "./schema/faqs.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Faqs.name, schema: FaqsSchema }]),
  ],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
