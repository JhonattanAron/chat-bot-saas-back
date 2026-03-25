import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ContractAssetDocument = Document & ContractAsset;

export enum ContractType {
  PLAN = "plan",
  ADDON = "addon",
  ONE_TIME = "one-time",
}

export enum ContractStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  CONSUMED = "consumed",
}

@Schema({ timestamps: true })
export class ContractAsset {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  // 🔥 Qué compró
  @Prop({ required: true })
  resourceId: string; // planId o addonId

  // 🔥 tipo (CLAVE)
  @Prop({ required: true, enum: ContractType })
  type: ContractType;

  // 🔥 cantidad
  @Prop({ default: 1 })
  quantity: number;

  // 💰 precio (útil para métricas)
  @Prop()
  unitPrice?: number;

  // 🔁 intervalo (solo para recurrentes)
  @Prop({ enum: ["month", "year", "week", "one-time"] })
  billingInterval?: string;

  // 📅 fechas reales
  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  // 🔥 estado
  @Prop({
    enum: ContractStatus,
    default: ContractStatus.ACTIVE,
  })
  status: ContractStatus;

  // 🔥 CRÍTICO → evita duplicados
  @Prop({ required: true })
  invoiceId: string;

  // 🧠 metadata flexible
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // 🔥 opcional (si quieres mantener compatibilidad)
  @Prop({ type: Map, of: Number, default: {} })
  limits?: { [key: string]: number };
}

export const ContractAssetSchema = SchemaFactory.createForClass(ContractAsset);
