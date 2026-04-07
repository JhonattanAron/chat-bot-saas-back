import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GlobalLogDocument = GlobalLog & Document;

@Schema({ timestamps: true }) // crea createdAt y updatedAt automáticamente
export class GlobalLog {
  @Prop({
    type: String,
    enum: ["info", "warning", "error", "debug"],
    default: "info",
  })
  level: "info" | "warning" | "error" | "debug";

  @Prop({ type: String, required: false })
  userId?: string; // opcional, puede ser null si es log del sistema

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: false })
  service?: string; // ejemplo: 'AurentricService', 'AuthModule'

  @Prop({ type: Object, required: false })
  meta?: Record<string, any>; // cualquier información extra

  @Prop({ type: String, required: false })
  stack?: string; // stack trace en caso de error
}

export const GlobalLogSchema = SchemaFactory.createForClass(GlobalLog);
