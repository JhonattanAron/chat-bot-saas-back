import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ScrapersService } from "./scrapers.service";
import { ScrapersController } from "./scrapers.controller";

import { Batch, BatchSchema } from "../batches/batches.schema";
import {
  PlacesBatch,
  PlacesBatchSchema,
} from "../google-maps-leads/schemas/places-batch.schema";
import {
  PlaceLead,
  PlaceLeadSchema,
} from "../google-maps-leads/schemas/place-lead.schema";

import { BatchesModule } from "../batches/batches.module";
import { GoogleMapsModule } from "../google-maps-leads/google-maps.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Batch.name, schema: BatchSchema },
      { name: PlacesBatch.name, schema: PlacesBatchSchema },
      { name: PlaceLead.name, schema: PlaceLeadSchema },
    ]),
    BatchesModule,
    GoogleMapsModule,
  ],
  controllers: [ScrapersController],
  providers: [ScrapersService],
})
export class ScrapersModule {}
