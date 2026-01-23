import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebChatConfigDocument = WebChatConfig & Document;

export enum ClientKeyStatus {
  PENDING = 'pending',
  WAITING_APPROVAL = 'waiting_approval',
  APPROVED = 'approved',
  BLOCKED = 'blocked',
}

@Schema({ timestamps: true, collection: 'web_chat_configs' })
export class WebChatConfig {
  @Prop({ required: true, unique: true, index: true })
  clientKey: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assistant', required: true, index: true })
  assistantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ApiKey' })
  apiKeyId?: Types.ObjectId;

  @Prop({ trim: true })
  domain?: string;

  @Prop({
    type: String,
    enum: ClientKeyStatus,
    default: ClientKeyStatus.PENDING,
    index: true,
  })
  status: ClientKeyStatus;

  @Prop()
  firstUsedAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Virtual field for createdAt from timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const WebChatConfigSchema = SchemaFactory.createForClass(WebChatConfig);

// Indexes for common queries
WebChatConfigSchema.index({ userId: 1, assistantId: 1 });
WebChatConfigSchema.index({ clientKey: 1, status: 1 });
WebChatConfigSchema.index({ domain: 1 }, { sparse: true });
