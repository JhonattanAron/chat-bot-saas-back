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

  @Prop({ required: true })
  batch_name: string; // Nombre personalizado de la búsqueda (ej: "Downtown Manhattan - Dental")

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

  // Nuevos campos para keywords y categorías
  @Prop({
    type: [String],
    default: [],
  })
  keywords: string[]; // ej: ["dental clinic", "orthodontist"]

  @Prop({
    type: [String],
    default: [],
  })
  categories: string[]; // ej: ["dentist", "health"]

  // Deep search fields
  @Prop({ default: false })
  is_deep_search: boolean; // Indica si es búsqueda profunda en zona previa

  @Prop()
  previous_batch_id?: string; // Referencia al batch anterior si es deep search

  @Prop({ default: "pending" })
  status: "pending" | "running" | "done" | "error";

  @Prop({ default: 0 })
  total_places: number;

  @Prop({ default: 0 })
  skipped_duplicates: number; // Cantidad de leads duplicados saltados en deep search

  @Prop()
  error_message?: string;

  @Prop({ default: Date.now })
  createdAt: string;

  @Prop({ default: Date.now })
  updatedAt: string;
}

export const PlacesBatchSchema = SchemaFactory.createForClass(PlacesBatch);
