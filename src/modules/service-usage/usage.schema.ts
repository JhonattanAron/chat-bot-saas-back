import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UsageDocument = Usage & Document;

@Schema({ timestamps: true })
export class Usage {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  resourceId: string; // "tokens", "storage", "vps"

  @Prop({ required: true })
  used: number;

  @Prop()
  periodStart?: Date;

  @Prop()
  periodEnd?: Date;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);
