import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PlaceLeadDocument = PlaceLead & Document;

@Schema({ timestamps: true })
export class PlaceLead {
  @Prop({ required: true })
  batch_id: string;

  @Prop({ required: true })
  place_id: string;

  @Prop()
  name: string;

  @Prop()
  phone: string;

  @Prop()
  website: string;

  @Prop()
  address: string;

  @Prop()
  rating: number;

  @Prop({
    type: {
      lat: Number,
      lng: Number,
    },
  })
  location: {
    lat: number;
    lng: number;
  };

  @Prop({ default: "google_places" })
  source: string;
}

export const PlaceLeadSchema = SchemaFactory.createForClass(PlaceLead);
