import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { FunctionSchema } from "./functions-schema";

export type AssistantChatDocument = AssistantChat & Document;

@Schema()
export class AssistantChat {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: () => [FunctionSchema], required: true })
  funciones: FunctionSchema[];

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  use_case: string;

  @Prop({ required: true })
  welcome_message: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  all_messages: number;

  @Prop({ default: "0 minutes" })
  last_activiti: string;
}

export const AssistantChatSchema = SchemaFactory.createForClass(AssistantChat);
