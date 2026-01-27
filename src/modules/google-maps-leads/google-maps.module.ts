import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GoogleMapsController } from "./google-maps.controller";
import { PlacesBatch, PlacesBatchSchema } from "./schemas/places-batch.schema";
import { PlaceLead, PlaceLeadSchema } from "./schemas/place-lead.schema";
import { GoogleMapsService } from "./services/google-maps.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlacesBatch.name, schema: PlacesBatchSchema },
      { name: PlaceLead.name, schema: PlaceLeadSchema },
    ]),
  ],
  controllers: [GoogleMapsController],
  providers: [GoogleMapsService],
})
export class GoogleMapsModule {}
