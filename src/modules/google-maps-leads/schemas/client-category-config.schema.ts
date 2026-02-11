import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientCategoryConfigDocument = ClientCategoryConfig & Document;

@Schema({ timestamps: true })
export class ClientCategoryConfig {
  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({
    type: [
      {
        _id: String,
        name: String,
        value: String,
        description: String,
        icon: String,
        keywords: [String],
        active: { type: Boolean, default: true },
      },
    ],
    default: [
      // Default categories
      {
        name: 'Dental Clinics',
        value: 'dentist',
        description: 'Dental offices and clinics',
        keywords: ['dental', 'dentist', 'orthodontist'],
        active: true,
      },
      {
        name: 'Restaurants',
        value: 'restaurant',
        description: 'Restaurants and food establishments',
        keywords: ['restaurant', 'cafe', 'diner'],
        active: true,
      },
      {
        name: 'Pharmacies',
        value: 'pharmacy',
        description: 'Pharmacies and drugstores',
        keywords: ['pharmacy', 'drugstore', 'chemist'],
        active: true,
      },
      {
        name: 'Medical Centers',
        value: 'hospital',
        description: 'Hospitals and medical centers',
        keywords: ['hospital', 'medical center', 'clinic'],
        active: true,
      },
      {
        name: 'Fitness Centers',
        value: 'gym',
        description: 'Gyms and fitness studios',
        keywords: ['gym', 'fitness', 'studio'],
        active: true,
      },
    ],
  })
  categories: {
    name: string;
    value: string;
    description: string;
    keywords: string[];
    active: boolean;
  }[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ClientCategoryConfigSchema =
  SchemaFactory.createForClass(ClientCategoryConfig);

ClientCategoryConfigSchema.index({ user_id: 1 });
