import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

// Esquema para los parámetros de la API
@Schema({ _id: false })
export class ApiParameter {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  required: boolean;

  @Prop()
  description?: string;
}

const ApiParameterSchema = SchemaFactory.createForClass(ApiParameter);

// Esquema para los headers de la API
@Schema({ _id: false })
export class ApiHeader {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

const ApiHeaderSchema = SchemaFactory.createForClass(ApiHeader);

// Esquema para la autenticación
@Schema({ _id: false })
export class ApiAuth {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  value: string;
}

const ApiAuthSchema = SchemaFactory.createForClass(ApiAuth);

// Esquema para la configuración de API
@Schema({ _id: false })
export class ApiConfig {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  method: string;

  @Prop({ type: [ApiHeaderSchema], default: [] })
  headers: ApiHeader[];

  @Prop({ type: [ApiParameterSchema], default: [] })
  parameters: ApiParameter[];

  @Prop({ type: ApiAuthSchema })
  auth?: ApiAuth;
}

const ApiConfigSchema = SchemaFactory.createForClass(ApiConfig);

// Esquema para las credenciales
@Schema({ _id: false })
export class FunctionCredential {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  description?: string;
}

const FunctionCredentialSchema =
  SchemaFactory.createForClass(FunctionCredential);

// Esquema principal para los elementos de función
@Schema()
export class FunctionItem {
  // Hacer _id público y opcional
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ enum: ["api", "custom"], required: true })
  type: "api" | "custom";

  @Prop({ type: ApiConfigSchema })
  api?: ApiConfig;

  @Prop()
  code?: string;

  @Prop({ type: [FunctionCredentialSchema], default: [] })
  credentials?: FunctionCredential[];
}

export const FunctionItemSchema = SchemaFactory.createForClass(FunctionItem);
export type FunctionItemDocument = FunctionItem & Document;

// Esquema principal para el conjunto de funciones
@Schema()
export class FunctionSchema {
  @Prop({ required: true })
  user_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "AssistantChat" })
  assistant_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: [FunctionItemSchema], required: true })
  functions: FunctionItem[];
}

export type FunctionSchemaDocument = FunctionSchema & Document;
export const FunctionSchemaSchema =
  SchemaFactory.createForClass(FunctionSchema);
