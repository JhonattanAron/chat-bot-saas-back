import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TelegramChatDocument = TelegramChat & Document;

@Schema({ timestamps: true })
export class TelegramChat {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  assistantId: string;

  @Prop({ required: true })
  telegramChatId: string; // ID único del chat en Telegram

  @Prop({ required: true })
  telegramUserId: string; // ID del usuario en Telegram

  @Prop()
  username: string; // Username de Telegram (@usuario)

  @Prop()
  firstName: string; // Nombre del usuario

  @Prop()
  lastName: string; // Apellido del usuario

  @Prop({ default: "active" })
  status: string; // active, archived, blocked

  @Prop({
    type: [
      {
        role: { type: String, enum: ["user", "assistant"] },
        content: String,
        createdAt: { type: Date, default: Date.now },
        important_info: { type: String, default: "" },
        messageId: Number, // ID del mensaje en Telegram
        messageType: { type: String, default: "text" }, // text, photo, audio, document, sticker, etc.
        mediaUrl: String, // URL del archivo multimedia si aplica
        replyToMessageId: Number, // ID del mensaje al que responde
      },
    ],
    default: [],
  })
  messages: {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
    important_info: string;
    messageId?: number;
    messageType?: string;
    mediaUrl?: string;
    replyToMessageId?: number;
  }[];

  @Prop({ default: Date.now })
  lastActivityAt: Date;

  @Prop({ required: true, default: 0 })
  input_tokens: number;

  @Prop({ required: true, default: 0 })
  output_tokens: number;

  @Prop({ type: [String], default: [] })
  monthly_counted_chats: string[];

  // Metadatos específicos de Telegram
  @Prop({ type: Object, default: {} })
  telegramMetadata: {
    chatType?: string; // private, group, supergroup, channel
    isBot?: boolean;
    languageCode?: string;
    isPremium?: boolean;
    photoUrl?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const TelegramChatSchema = SchemaFactory.createForClass(TelegramChat);
