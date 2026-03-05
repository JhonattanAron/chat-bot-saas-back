import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ProductDocument = ProductAssistan & Document;

@Schema()
export class ProductAssistan {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  assistant_id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  available: boolean;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: [Number], default: [] })
  embedding: number[];
}

export const ProductSchema = SchemaFactory.createForClass(ProductAssistan);
