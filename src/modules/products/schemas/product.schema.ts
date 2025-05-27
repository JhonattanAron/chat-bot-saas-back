import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: [Number], default: [] })
  embedding: number[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
