import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type FunctionSchemaDocument = FunctionSchema & Document;

@Schema()
export class FunctionSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ enum: ["api", "custom"], required: true })
  type: "api" | "custom";

  @Prop({
    type: {
      url: String,
      method: String,
      headers: [
        {
          key: String,
          value: String,
        },
      ],
      parameters: [
        {
          name: String,
          type: String,
          required: Boolean,
          description: String,
        },
      ],
      auth: {
        type: {
          type: String,
          value: String,
        },
      },
    },
    required: false,
  })
  api?: {
    url: string;
    method: string;
    headers: { key: string; value: string }[];
    parameters: {
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }[];
    auth?: {
      type: string;
      value: string;
    } | null;
  };

  @Prop()
  code?: string;

  @Prop({
    type: [
      {
        name: String,
        value: String,
        description: String,
      },
    ],
  })
  credentials?: {
    name: string;
    value: string;
    description?: string;
  }[];
}

export const FunctionSchemaSchema =
  SchemaFactory.createForClass(FunctionSchema);
