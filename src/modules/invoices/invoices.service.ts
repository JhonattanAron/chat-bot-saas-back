import { CryptoUtil } from "../common/security/crypto.util";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Invoice,
  InvoiceDocument,
  InvoiceStatus,
} from "./schemas/invoice.schema";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CheckoutInvoiceDto,
} from "./dto/invoice.dto";
import { ContractedAssetsService } from "../contracted-assets/contracted-assets.service";

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private readonly contractService: ContractedAssetsService,
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
      status: InvoiceStatus.Pending,
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

      { new: true },
    );
  }

  async updateStatus(
    id: string,
    userId: string,
    status: InvoiceStatus,
  ): Promise<InvoiceDocument | null> {
    const updateData: Partial<InvoiceDocument> = { status };
    if (status === InvoiceStatus.PAID) {
      updateData.paidDate = new Date();
    }
    return this.invoiceModel.findOneAndUpdate({ _id: id, userId }, updateData, {
      new: true,
    });
  }

  async updateByInvoiceNumber(
    invoiceNumber: string,
    userId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOneAndUpdate(
      { invoiceNumber },
      updateInvoiceDto,
      { new: true },
    );
  }

  async processPayment(
    invoiceNumber: string,
    transactionId: string,
    clientTransactionId: string,
  ): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceModel.findOne({ invoiceNumber });

    if (!invoice) return null;

    // 🛡️ IDPOTENCIA (CLAVE 🔥)
    if (invoice.status === InvoiceStatus.PAID) {
      return invoice;
    }

    const updated = await this.invoiceModel.findByIdAndUpdate(
      invoice._id,
      {
        status: InvoiceStatus.PAID,
        transactionId,
        clientTransactionId,
        paidDate: new Date(),
      },
      { new: true },
    );

    if (!updated) {
      throw new Error("Failed to update invoice");
    }
    console.log("El contrato se va a crear ...");

    await this.contractService.processInvoice(updated);

    return updated;
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
    const lastInvoice = await this.invoiceModel
      .findOne()
      .sort({ createdAt: -1 })
      .select("invoiceNumber");

    if (!lastInvoice) {
      return `INV-${new Date().getFullYear()}-00001`;
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
    const newNumber = String(lastNumber + 1).padStart(5, "0");

    return `INV-${new Date().getFullYear()}-${newNumber}`;
  }

  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  async getByInvoiceNumber(invoiceNumber: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel.findOne({ invoiceNumber }).lean();

    if (!invoice) {
      throw new NotFoundException("Factura no encontrada");
    }

    return invoice as InvoiceDocument;
  }

  async createFromCheckout(
    userId: string,
    checkoutDto: any,
  ): Promise<InvoiceDocument> {
    const items = checkoutDto.cartItems || [];

    const invoiceNumber = await this.generateInvoiceNumber();
    const paymentReference = CryptoUtil.generatePaymentReference(invoiceNumber);
    const integrityHash = CryptoUtil.generateIntegrityHash(
      invoiceNumber,
      InvoiceStatus.Pending,
      checkoutDto.total,
    );

    const createdInvoice = new this.invoiceModel({
      userId,
      invoiceNumber,
      paymentReference,
      clientName: checkoutDto.clientName ?? checkoutDto.clientEmail ?? "",
      clientEmail: checkoutDto.clientEmail ?? "",
      items: items.map((item: any) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        billingInterval: item.billingInterval,
        type: item.type,
        itemId: item.itemId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      subtotal: checkoutDto.subtotal,
      tax: checkoutDto.tax,
      total: checkoutDto.total,
      status: InvoiceStatus.Pending,
      integrityHash,
      issuedDate: new Date(),
      dueDate: this.getDefaultDueDate(),
      transactionId: checkoutDto.transactionId,
      clientTransactionId: checkoutDto.clientTransactionId,
      notes: checkoutDto.notes,
    });

    return createdInvoice.save();
  }

  async assignAssets(invoiceId: string): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new Error("Invoice must be paid before assigning assets");
    }

    return invoice;
  }

  verifyIntegrityHash(invoice: InvoiceDocument): boolean {
    if (!invoice.integrityHash) {
      return true;
    }

    return CryptoUtil.verifyIntegrityHash(
      invoice.invoiceNumber,
      invoice.status,
      invoice.total,
      invoice.integrityHash,
    );
  }

  async findByPaymentReference(
    paymentReference: string,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOne({ paymentReference });
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOne({ transactionId });
  }
}
