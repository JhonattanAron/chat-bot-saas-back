import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Batch extends Document {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  search_query: string;

  @Prop({ default: "pending" })
  status: string;

  @Prop({ default: 0 })
  total_urls: number;

  @Prop({ default: 0 })
  processed_urls: number;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);
