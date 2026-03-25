import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type InvoiceDocument = HydratedDocument<Invoice>;

export enum InvoiceStatus {
  DRAFT = "Borrador",
  Pending = "Pendiente",
  SENT = "Enviada",
  PAID = "Pagada",
  OVERDUE = "Atrasada",
  EXPIRED = "Vencida",
  CANCELLED = "Cancelada",
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, type: Types.ObjectId, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ required: true })
  clientName: string;

  @Prop({ required: true })
  clientEmail: string;

  @Prop()
  clientAddress?: string;

  @Prop({ required: true, type: [Object] })
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ enum: InvoiceStatus, default: InvoiceStatus.Pending })
  status: InvoiceStatus;

  @Prop({ type: Date })
  issuedDate: Date;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Date })
  paidDate?: Date;

  @Prop()
  notes?: string;

  @Prop()
  terms?: string;

  @Prop()
  transactionId?: string;

  @Prop()
  clientTransactionId?: string;

  @Prop()
  integrityHash?: string;

  @Prop()
  paymentReference?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ userId: 1, createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ paymentReference: 1 });
InvoiceSchema.index({ transactionId: 1 });
