import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PlacesBatchDocument = PlacesBatch & Document;

@Schema({ timestamps: true })
export class PlacesBatch {
  @Prop({ required: true })
  user_id: string;

  @Prop({ default: "google_places" })
  source: string;

  @Prop({ required: true })
  query: string; // ej: restaurantes

  @Prop({
    type: {
      lat: Number,
      lng: Number,
    },
    required: true,
  })
  location: {
    lat: number;
    lng: number;
  };

  @Prop({ default: 5000 })
  radius: number;

  @Prop({ default: "pending" })
  status: "pending" | "running" | "done" | "error";

  @Prop({ default: 0 })
  total_places: number;
}

export const PlacesBatchSchema = SchemaFactory.createForClass(PlacesBatch);
