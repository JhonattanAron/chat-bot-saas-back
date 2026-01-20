import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document, Schema as MongooseSchema } from "mongoose";

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true }) // Adds createdAt and updatedAt fields automatically
export class ApiKey {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  key: string; // The actual API key string

  @Prop({ required: true })
  name: string; // A human-readable name for the API key

  @Prop({ default: true })
  isActive: boolean; // Indicates if the API key is active

  @Prop({ default: Date.now })
  createdAt: Date; // Timestamp for when the API key was created

  @Prop({ required: true })
  user_id: MongooseSchema.Types.ObjectId; // The ID of the user who created the API key
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
