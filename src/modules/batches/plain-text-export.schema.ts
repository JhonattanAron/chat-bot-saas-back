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
}

export const PlainTextExportSchema =
  SchemaFactory.createForClass(PlainTextExport);
