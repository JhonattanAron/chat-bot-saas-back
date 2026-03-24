import {
  IsString,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { InvoiceStatus } from "../schemas/invoice.schema";

export class CreateInvoiceDto {
  @IsString()
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsArray()
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;

  @IsString()
  subtotal: number;

  @IsOptional()
  @IsString()
  tax?: number;

  @IsString()
  total: number;

  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsArray()
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  clientTransactionId?: string;
}

export class CheckoutInvoiceDto {
  @IsString()
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsArray()
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsArray()
  assets?: Array<{
    assetId: string;
    name: string;
    type: string;
  }>;
}

export class WebhookPaymentDto {
  @IsString()
  id: string;

  @IsString()
  clientTxId: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

export class PaymentConfirmationDto {
  @IsString()
  transactionId: string;

  @IsString()
  clientTransactionId: string;

  @IsString()
  status: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
