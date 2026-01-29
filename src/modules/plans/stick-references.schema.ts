import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { Document } from "mongoose";

export type StickReferencesDocument = StickReferences & Document;
export type BillingCycle = "monthly" | "yearly";

@Schema({ timestamps: true })
export class StickReferences {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  reference: string; // Plan encriptado para seguridad

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  expires_at: Date;

  @Prop({ default: Date.now })
  created_at: Date;
  @Prop({
    type: String,
    enum: ["monthly", "yearly"],
    required: true,
    default: "monthly",
  })
  billing_cycle: BillingCycle;
}

export const StickReferencesSchema =
  SchemaFactory.createForClass(StickReferences);
