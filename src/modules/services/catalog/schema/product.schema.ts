import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ProductDocument = Product & Document;

export enum ProductCategory {
  SAAS = "saas",
  VPS = "vps",
  ADDON = "addon",
  SERVICE = "service",
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ProductCategory })
  category: ProductCategory;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: true })
  active: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ name: "text", description: "text" });
