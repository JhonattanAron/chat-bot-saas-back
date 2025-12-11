import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TelegramBotDocument = TelegramBot & Document;

@Schema({ timestamps: true })
export class TelegramBot {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  assistantId: string;

  @Prop({ required: true })
  botName: string;

  @Prop({ required: true })
  botUsername: string;

  @Prop({ required: true })
  botId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  connectedAt: Date;

  @Prop()
  lastActivityAt: Date;

  @Prop({ type: Object })
  botInfo: any;
}

export const TelegramBotSchema = SchemaFactory.createForClass(TelegramBot);
