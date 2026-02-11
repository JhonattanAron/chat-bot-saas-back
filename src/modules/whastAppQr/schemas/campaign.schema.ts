import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type WhastAppCampaignDocument = WhastAppCampaign & Document;

@Schema({ timestamps: true })
export class WhastAppCampaign {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  assistant_id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    enum: ["draft", "scheduled", "active", "paused", "completed"],
    default: "draft",
  })
  status: string;

  @Prop({ required: true })
  message_template: string;

  @Prop({ type: [String], default: [] })
  contact_numbers: string[];

  @Prop()
  scheduled_at?: Date;

  @Prop()
  started_at?: Date;

  @Prop()
  completed_at?: Date;

  @Prop({ default: 0 })
  messages_sent: number;

  @Prop({ default: 0 })
  messages_failed: number;

  @Prop({ default: 0 })
  messages_delivered: number;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  finished_at?: Date;
}

export const WhastAppCampaignSchema =
  SchemaFactory.createForClass(WhastAppCampaign);
