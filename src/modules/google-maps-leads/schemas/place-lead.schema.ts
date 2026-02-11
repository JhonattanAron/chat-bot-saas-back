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

  @Prop()
  review_count: number;

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

  // Campos para tracking de deep search
  @Prop({ default: false })
  found_in_deep_search: boolean; // Indica si fue encontrado en búsqueda profunda

  @Prop()
  original_batch_id?: string; // ID del batch original si fue duplicado

  @Prop()
  matching_keywords?: string[]; // Keywords que coincidieron con este lugar

  @Prop()
  categories?: string[]; // Categorías asociadas

  @Prop({ default: "active" })
  status: "active" | "duplicate" | "invalid" | "archived";

  @Prop()
  business_type?: string;

  @Prop()
  hours?: string;

  @Prop()
  verified: boolean;

  @Prop({ default: Date.now })
  created_at: string;

  @Prop({ default: Date.now })
  updated_at: string;

  // Index para búsquedas rápidas
  @Prop({ index: true })
  batch_id_index: string;

  @Prop({ index: true })
  place_id_index: string;
}

export const PlaceLeadSchema = SchemaFactory.createForClass(PlaceLead);

// Crear índices compuestos para optimizar queries
PlaceLeadSchema.index({ batch_id: 1, place_id: 1 }, { unique: true });
PlaceLeadSchema.index({ batch_id: 1, found_in_deep_search: 1 });
PlaceLeadSchema.index({ original_batch_id: 1 });
