import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ContactStatus } from "../enums/contact-status.enum";

@Schema({ timestamps: true })
export class Contact extends Document {
  @Prop({ required: true, index: true })
  ownerId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({
    type: String,
    enum: Object.values(ContactStatus),
    default: ContactStatus.NEW,
  })
  status: ContactStatus;

  @Prop({
    type: String,
    required: true,
  })
  source: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  assignedTo?: string;

  @Prop()
  pipelineId?: string;

  @Prop()
  stageId?: string;

  @Prop({ type: Object, default: {} })
  customFields: Record<string, any>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

/* INDEXES */

// Unique email per owner (only when email exists)
ContactSchema.index(
  { ownerId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  },
);

// Unique phone per owner (only when phone exists)
ContactSchema.index(
  { ownerId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: "string" },
    },
  },
);

// Query helpers
ContactSchema.index({ ownerId: 1, status: 1 });
ContactSchema.index({ ownerId: 1, tags: 1 });
ContactSchema.index({ ownerId: 1, assignedTo: 1 });
