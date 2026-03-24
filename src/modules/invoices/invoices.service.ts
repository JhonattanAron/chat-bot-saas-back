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
import { CryptoUtil } from "../common/security/crypto.util";

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
  async getByInvoiceNumber(invoiceNumber: string) {
    const invoice = await this.invoiceModel.findOne({ invoiceNumber }).lean();

    if (!invoice) {
      throw new NotFoundException("Factura no encontrada");
    }

    return invoice;
  }

  /**
   * Create invoice from checkout (for payments)
   */
  async createFromCheckout(
    userId: string,
    checkoutDto: CheckoutInvoiceDto,
  ): Promise<InvoiceDocument> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const paymentReference = CryptoUtil.generatePaymentReference(invoiceNumber);

    // Generate integrity hash for security
    const integrityHash = CryptoUtil.generateIntegrityHash(
      invoiceNumber,
      InvoiceStatus.Pending,
      checkoutDto.total,
    );

    const createdInvoice = new this.invoiceModel({
      userId,
      invoiceNumber,
      paymentReference,
      clientName: checkoutDto.clientName,
      clientEmail: checkoutDto.clientEmail,
      cartItems: checkoutDto.cartItems,
      assets: checkoutDto.assets || [],
      items: checkoutDto.cartItems.map((item) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal: checkoutDto.subtotal,
      tax: checkoutDto.tax,
      total: checkoutDto.total,
      status: InvoiceStatus.Pending,
      integrityHash,
      issuedDate: new Date(),
      dueDate: this.getDefaultDueDate(),
    });

    return createdInvoice.save();
  }

  /**
   * Process payment - update invoice with payment details
   */
  async processPayment(
    invoiceNumber: string,
    transactionId: string,
    clientTransactionId: string,
  ): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceModel.findOne({ invoiceNumber });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice ${invoiceNumber} not found`,
      );
    }

    // Verify integrity before processing
    if (!this.verifyIntegrityHash(invoice)) {
      throw new Error('Invoice integrity check failed');
    }

    // Update invoice with payment details
    const updatedInvoice = await this.invoiceModel.findOneAndUpdate(
      { invoiceNumber },
      {
        status: InvoiceStatus.PAID,
        paidDate: new Date(),
        transactionId,
        clientTransactionId,
      },
      { new: true },
    );

    return updatedInvoice;
  }

  /**
   * Assign assets to user after payment
   */
  async assignAssets(invoiceId: string): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new Error('Invoice must be paid before assigning assets');
    }

    // Assets assignment logic - update user with assigned assets
    // This could be extended to update a User collection or assets collection
    console.log(
      `[Assets Assigned] Invoice: ${invoice.invoiceNumber}, Assets: ${invoice.assets?.length || 0}`,
    );

    return invoice;
  }

  /**
   * Verify integrity hash of invoice
   */
  verifyIntegrityHash(invoice: InvoiceDocument): boolean {
    if (!invoice.integrityHash) {
      return true; // Skip check if no hash present (legacy invoices)
    }

    return CryptoUtil.verifyIntegrityHash(
      invoice.invoiceNumber,
      invoice.status,
      invoice.total,
      invoice.integrityHash,
    );
  }

  /**
   * Find invoice by payment reference
   */
  async findByPaymentReference(
    paymentReference: string,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOne({ paymentReference });
  }

  /**
   * Find invoice by transaction ID
   */
  async findByTransactionId(
    transactionId: string,
  ): Promise<InvoiceDocument | null> {
    return this.invoiceModel.findOne({ transactionId });
  }
}
