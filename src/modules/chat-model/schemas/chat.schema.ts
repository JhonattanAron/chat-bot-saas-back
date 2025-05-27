// chat.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true }) // agrega createdAt y updatedAt
export class Chat extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  chatId: string;

  @Prop({ required: true })
  prompt: string; // prompt corto generado automáticamente por user

  @Prop({ type: [{ role: String, content: String }], default: [] })
  messages: { role: "user" | "assistant"; content: string }[];

  @Prop({ default: null })
  lastActivityAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
