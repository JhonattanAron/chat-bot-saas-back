import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type DashboardStatsDocument = DashboardStats & Document;

@Schema({ timestamps: true })
export class DashboardStats {
  @Prop({ required: true, type: String })
  user_id: string;

  // Estadísticas de tokens
  @Prop({ default: 0 })
  total_input_tokens: number;

  @Prop({ default: 0 })
  total_output_tokens: number;

  @Prop({ default: 0 })
  monthly_input_tokens: number;

  @Prop({ default: 0 })
  monthly_output_tokens: number;

  // Estadísticas de bots
  @Prop({ default: 0 })
  total_bots_created: number;

  @Prop({ default: 0 })
  active_bots: number;

  @Prop({ default: 0 })
  deleted_bots: number;

  // Estadísticas de conversaciones
  @Prop({ default: 0 })
  total_conversations: number;

  @Prop({ default: 0 })
  monthly_conversations: number;

  @Prop({ default: 0 })
  total_messages: number;

  @Prop({ default: 0 })
  monthly_messages: number;

  // Estadísticas de usuarios activos (para el dashboard)
  @Prop({ default: 0 })
  unique_users_interacted: number;

  // Fecha del último reset mensual
  @Prop({ type: Date, default: Date.now })
  last_monthly_reset: Date;

  // Historial de actividad por mes
  @Prop({
    type: [
      {
        month: String, // formato: "2025-01"
        input_tokens: Number,
        output_tokens: Number,
        conversations: Number,
        messages: Number,
        bots_created: Number,
        bots_deleted: Number,
      },
    ],
    default: [],
  })
  monthly_history: Array<{
    month: string;
    input_tokens: number;
    output_tokens: number;
    conversations: number;
    messages: number;
    bots_created: number;
    bots_deleted: number;
  }>;

  // Chats ya contados para tokens (solo sumamos lo nuevo)
  @Prop({
    type: [
      {
        chat_id: String,
        last_input_tokens: Number,
        last_output_tokens: Number,
      },
    ],
    default: [],
  })
  counted_chats: Array<{
    chat_id: string;
    last_input_tokens: number;
    last_output_tokens: number;
  }>;
}

export const DashboardStatsSchema =
  SchemaFactory.createForClass(DashboardStats);
