import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Invoice,
  InvoiceDocument,
  InvoiceStatus,
} from "./schemas/invoice.schema";
import { CreateInvoiceDto, UpdateInvoiceDto } from "./dto/invoice.dto";

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(
    userId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceDocument> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const createdInvoice = new this.invoiceModel({
      userId,
      invoiceNumber,
      ...createInvoiceDto,
      issuedDate: createInvoiceDto.issuedDate || new Date(),
      dueDate: createInvoiceDto.dueDate || this.getDefaultDueDate(),
    });
    return createdInvoice.save();
  }

  async findById(id: string, userId: string): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOne({ _id: id, userId });
  }

  async findByUser(
    userId: string,
    limit = 50,
    skip = 0,
  ): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async update(
    id: string,
    userId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOneAndUpdate(
      { _id: id, userId },
      updateInvoiceDto,
      {
        new: true,
      },
    );
  }

  async updateStatus(
    id: string,
    userId: string,
    status: InvoiceStatus,
  ): Promise<InvoiceDocument | null> {
    const updateData: any = { status };
    if (status === InvoiceStatus.PAID) {
      updateData.paidDate = new Date();
    }
    return this.invoiceModel.findOneAndUpdate({ _id: id, userId }, updateData, {
      new: true,
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.invoiceModel.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  async getUserStats(userId: string) {
    const invoices = await this.invoiceModel.find({ userId });
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      unpaidAmount: totalAmount - paidAmount,
      invoicesByStatus: {
        draft: invoices.filter((inv) => inv.status === InvoiceStatus.DRAFT)
          .length,
        sent: invoices.filter((inv) => inv.status === InvoiceStatus.SENT)
          .length,
        paid: invoices.filter((inv) => inv.status === InvoiceStatus.PAID)
          .length,
        overdue: invoices.filter((inv) => inv.status === InvoiceStatus.OVERDUE)
          .length,
      },
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.invoiceModel.countDocuments();
    return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }

  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }
}
