import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GoogleMapsController } from "./google-maps.controller";
import { PlacesBatch, PlacesBatchSchema } from "./schemas/places-batch.schema";
import { PlaceLead, PlaceLeadSchema } from "./schemas/place-lead.schema";
import { GoogleMapsService } from "./services/google-maps.service";
import {
  ClientCategoryConfig,
  ClientCategoryConfigSchema,
} from "./schemas/client-category-config.schema";
import { ZoneHistory, ZoneHistorySchema } from "./schemas/zone-history.schema";
import { GoogleMapsConfigController } from "./controllers/google-maps-config.controller";
import { GoogleMapsConfigService } from "./services/google-maps-config.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlacesBatch.name, schema: PlacesBatchSchema },
      { name: PlaceLead.name, schema: PlaceLeadSchema },
      { name: ClientCategoryConfig.name, schema: ClientCategoryConfigSchema },
      { name: ZoneHistory.name, schema: ZoneHistorySchema },
    ]),
  ],
  controllers: [GoogleMapsController, GoogleMapsConfigController],
  providers: [GoogleMapsService, GoogleMapsConfigService],
  exports: [GoogleMapsService],
})
export class GoogleMapsModule {}
