import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type FaqItemDocument = FaqItem & Document;

@Schema({ _id: false })
export class FaqItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [Number], default: [] })
  embedding?: number[];

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

const FaqItemSchema = SchemaFactory.createForClass(FaqItem);

@Schema()
export class Faqs {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  assistant_id: string;

  @Prop({ type: [FaqItemSchema], required: true })
  faqs: FaqItem[];
}

export type FaqsDocument = Faqs & Document;
export const FaqsSchema = SchemaFactory.createForClass(Faqs);
