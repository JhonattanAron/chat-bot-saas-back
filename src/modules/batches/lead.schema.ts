// lead.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  batch_id: string;

  @Prop({ default: "" })
  company_name: string;

  @Prop({ default: "" })
  url: string;

  @Prop({ default: "" })
  meta_description: string;

  @Prop({ type: [String], default: [] })
  emails: string[];

  @Prop({ type: [String], default: [] })
  phones: string[];

  @Prop({ type: [String], default: [] })
  social_links: string[];

  @Prop({ default: "pending" }) // pending, extracted, failed
  extraction_status: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
