import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  userId: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ["user", "assistant"] },
        content: String,
        createdAt: { type: Date, default: Date.now },
        important_info: { type: String, default: "" },
      },
    ],
    default: [],
  })
  messages: {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
    important_info: string;
  }[];

  @Prop({ default: Date.now })
  lastActivityAt: Date;

  @Prop({ required: true, default: 0 })
  input_tokens: number;

  @Prop({ required: true, default: 0 })
  output_tokens: number;
  // Por ejemplo, en el DashboardStats guardamos los IDs de chats contados
  monthly_counted_chats: string[]; // o total_counted_chats

  // These fields are automatically added by timestamps: true
  createdAt?: Date;
  updatedAt?: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
