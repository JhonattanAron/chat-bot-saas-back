import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ChatDocument = Chat & Document;

@Schema()
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
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
