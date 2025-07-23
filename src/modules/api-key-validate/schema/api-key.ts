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

  // Mongoose automatically adds an _id field, which can serve as the unique identifier.
  // If you need a separate 'id' field that's not _id, you can add it here.
  // For simplicity, we'll use _id as the primary identifier.
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
