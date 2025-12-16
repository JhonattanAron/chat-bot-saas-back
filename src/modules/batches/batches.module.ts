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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "Lead", schema: require("./lead.schema").LeadSchema },
    ]),
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
    MongooseModule.forFeature([
      { name: PlainTextExport.name, schema: PlainTextExportSchema },
    ]),
  ],
  controllers: [BatchesController],
  providers: [BatchesService, GoogleService],
})
export class BatchesModule {}
