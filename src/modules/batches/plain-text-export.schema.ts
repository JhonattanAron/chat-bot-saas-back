// plain-text-export.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PlainTextExportDocument = PlainTextExport & Document;

@Schema({ timestamps: true }) // timestamps crea createdAt y updatedAt automáticamente
export class PlainTextExport {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  batch_id: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: false, default: false })
  analized: boolean;

  @Prop({ required: false, default: "" })
  analized_data: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PlainTextExportSchema =
  SchemaFactory.createForClass(PlainTextExport);
