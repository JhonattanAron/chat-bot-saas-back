import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ZoneHistoryDocument = ZoneHistory & Document;

@Schema({ timestamps: true })
export class ZoneHistory {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  batch_id: string;

  @Prop({
    type: {
      lat: Number,
      lng: Number,
    },
    required: true,
    index: '2dsphere',
  })
  location: {
    lat: number;
    lng: number;
  };

  @Prop({ required: true, default: 5000 })
  radius: number;

  @Prop()
  batch_name: string;

  @Prop({ type: [String] })
  keywords: string[];

  @Prop({ type: [String] })
  categories: string[];

  @Prop({ default: false })
  is_deep_search: boolean;

  @Prop()
  previous_batch_id?: string;

  @Prop({ default: 0 })
  total_places_found: number;

  @Prop({ default: Date.now })
  scrapedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ZoneHistorySchema = SchemaFactory.createForClass(ZoneHistory);

// Índices para búsquedas geoespaciales y rápidas
ZoneHistorySchema.index({ user_id: 1, createdAt: -1 });
ZoneHistorySchema.index({ location: '2dsphere' });
ZoneHistorySchema.index({ batch_id: 1 });
