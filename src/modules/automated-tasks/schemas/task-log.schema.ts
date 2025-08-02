import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class TaskLog {
  @Prop({ required: true })
  taskId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: any;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export type TaskLogDocument = TaskLog & Document;
export const TaskLogSchema = SchemaFactory.createForClass(TaskLog);
