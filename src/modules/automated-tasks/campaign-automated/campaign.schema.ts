import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CampaignDocument = Campaign & Document;

export type CampaignStatus =
  | "created"
  | "scraping"
  | "extracted"
  | "normalizing"
  | "sending"
  | "completed"
  | "error";

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  batchId: string;

  @Prop({
    enum: [
      "created",
      "scraping",
      "extracted",
      "normalizing",
      "sending",
      "completed",
      "error",
    ],
    default: "created",
  })
  status: CampaignStatus;

  // Scraping
  @Prop({ default: false })
  scraping_exitoso: boolean;

  @Prop({ default: 0 })
  urls_total: number;

  @Prop({ default: 0 })
  urls_procesadas: number;

  @Prop({ default: 0 })
  informacion_extraida: number;

  // Emails
  @Prop({ default: 0 })
  emails_encontrados: number;

  @Prop({ default: false })
  emails_normalizados: boolean;

  @Prop({
    type: {
      correctos: { type: Number, default: 0 },
      incorrectos: { type: Number, default: 0 },
    },
    default: { correctos: 0, incorrectos: 0 },
  })
  emails_enviados: {
    correctos: number;
    incorrectos: number;
  };

  @Prop()
  error?: string;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
