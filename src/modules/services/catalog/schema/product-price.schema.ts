import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ProductPriceDocument = ProductPrice & Document;

export enum BillingType {
  ONE_TIME = "one_time",
  RECURRING = "recurring",
}

export enum BillingInterval {
  MONTH = "month",
  YEAR = "year",
}

@Schema({ timestamps: true })
export class ProductPrice {
  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
  product: Types.ObjectId;

  @Prop({ required: true, enum: BillingType })
  billingType: BillingType;

  @Prop({ enum: BillingInterval })
  interval: BillingInterval;

  @Prop({ required: true })
  price: number;

  @Prop({ default: "USD" })
  currency: string;

  @Prop()
  stripePriceId: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  active: boolean;
}

export const ProductPriceSchema = SchemaFactory.createForClass(ProductPrice);

ProductPriceSchema.index({ product: 1 });
