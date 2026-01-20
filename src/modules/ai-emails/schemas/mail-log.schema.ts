// mail/schemas/mail-log.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class MailLog extends Document {
  @Prop({ required: true })
  messageId: string; // ID de Resend

  @Prop({ required: true })
  to: string;

  @Prop()
  subject: string;

  @Prop({ required: true })
  type: string; // invoice | alert | welcome | custom

  @Prop()
  userId?: string;

  @Prop()
  entityId?: string; // invoiceId, orderId, etc.

  @Prop({ default: "sent" })
  status: string; // sent | delivered | opened | bounced
  @Prop({ required: true })
  batch: string;
}

export const MailLogSchema = SchemaFactory.createForClass(MailLog);
