import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CampaignMessageDocument = CampaignMessage & Document;

@Schema({ timestamps: true })
export class CampaignMessage {
  @Prop({ required: true })
  campaign_id: string;

  @Prop({ required: true })
  phone_number: string;

  @Prop()
  chat_id?: string;

  @Prop({ required: true })
  message_content: string;

  @Prop({
    enum: ["pending", "sent", "delivered", "failed"],
    default: "pending",
  })
  status: string;

  @Prop()
  sent_at?: Date;

  @Prop()
  delivered_at?: Date;

  @Prop()
  error_message?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const CampaignMessageSchema =
  SchemaFactory.createForClass(CampaignMessage);
