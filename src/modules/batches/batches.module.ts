import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BatchesService } from "./batches.service";
import { BatchesController } from "./batches.controller";
import { Batch, BatchSchema } from "./batches.schema";
import { GoogleService } from "./google.service";
import {
  PlainTextExport,
  PlainTextExportSchema,
} from "./plain-text-export.schema";
import { ChatModule } from "../chat-model/chat/chat.module";
import { EmailPromptService } from "./lib/utils";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "Lead", schema: require("./lead.schema").LeadSchema },
    ]),
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
    MongooseModule.forFeature([
      { name: PlainTextExport.name, schema: PlainTextExportSchema },
    ]),
    ChatModule,
  ],
  controllers: [BatchesController],
  providers: [BatchesService, GoogleService, EmailPromptService],
  exports: [BatchesService],
})
export class BatchesModule {}
