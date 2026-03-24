import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { InvoicesService } from "../invoices/invoices.service";
import {
  WebhookPaymentDto,
  PaymentConfirmationDto,
} from "../invoices/dto/invoice.dto";
import { CryptoUtil } from "../common/security/crypto.util";
import { lastValueFrom } from "rxjs";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly payphoneToken: string;
  private readonly payphoneStoreId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly invoicesService: InvoicesService,
  ) {
    // Leer variables de entorno de manera segura y moderna
    this.payphoneToken = this.configService.get<string>("PAYPHONE_TOKEN") ?? "";
    this.payphoneStoreId =
      this.configService.get<string>("PAYPHONE_STORE_ID") ?? "";

    if (!this.payphoneToken) {
      this.logger.warn("PAYPHONE_TOKEN not configured");
    }

    if (!this.payphoneStoreId) {
      this.logger.warn("PAYPHONE_STORE_ID not configured");
    }
  }

  /**
   * Confirm payment status with Payphone API
   */
  async confirmPaymentStatus(
    transactionId: string,
    clientTransactionId: string,
  ): Promise<PaymentConfirmationDto> {
    try {
      this.logger.log(
        `[Payphone] Confirming payment - ID: ${transactionId}, ClientTxId: ${clientTransactionId}`,
      );

      const headers = {
        Authorization: `Bearer ${this.payphoneToken}`,
        "Content-Type": "application/json",
      };

      const payload = {
        id: transactionId,
        clientTxId: clientTransactionId,
      };

      const observable = this.httpService.post<any>(
        "https://pay.payphonetodoesposible.com/api/button/V2/Confirm",
        payload,
        { headers },
      );

      const response = await lastValueFrom(observable);

      if (!response?.data) {
        throw new Error("Invalid response from Payphone API");
      }

      this.logger.log(
        `[Payphone] Payment confirmed - Status: ${response.data.status}`,
      );

      return {
        transactionId: response.data.id ?? transactionId,
        clientTransactionId: response.data.clientTxId ?? clientTransactionId,
        status: response.data.status ?? "CONFIRMED",
        amount: response.data.amount ?? 0,
        paymentMethod: response.data.paymentMethod ?? "UNKNOWN",
      };
    } catch (error: any) {
      this.logger.error(
        `[Payphone] Error confirming payment: ${error?.message ?? error}`,
      );
      throw new BadRequestException(
        `Failed to confirm payment: ${error?.message ?? error}`,
      );
    }
  }

  /**
   * Process webhook from Payphone
   */
  async processPaymentWebhook(webhookDto: WebhookPaymentDto): Promise<any> {
    try {
      this.logger.log(
        `[Webhook] Processing Payphone webhook - ID: ${webhookDto.id}`,
      );

      const confirmation = await this.confirmPaymentStatus(
        webhookDto.id,
        webhookDto.clientTxId,
      );

      // Buscar invoice
      let invoice = await this.invoicesService.findByTransactionId(
        webhookDto.id,
      );
      if (!invoice) {
        invoice = await this.invoicesService.findByTransactionId(
          webhookDto.clientTxId,
        );
      }

      if (!invoice) {
        this.logger.warn(
          `[Webhook] Invoice not found for transaction ID: ${webhookDto.id}`,
        );
        throw new BadRequestException("Invoice not found for this transaction");
      }

      this.logger.log(
        `[Webhook] Found invoice: ${invoice.invoiceNumber}, processing payment...`,
      );
      // Dentro de processPaymentWebhook
      const updatedInvoice = await this.invoicesService.processPayment(
        invoice.invoiceNumber,
        confirmation.transactionId,
        confirmation.clientTransactionId,
      );

      // Validar que no sea null
      if (!updatedInvoice) {
        this.logger.error(
          `[Webhook] Failed to update invoice: ${invoice.invoiceNumber}`,
        );
        throw new BadRequestException("Failed to update invoice status");
      }

      // Asignar assets
      if (updatedInvoice.assets?.length) {
        await this.invoicesService.assignAssets(updatedInvoice._id.toString());
        this.logger.log(
          `[Webhook] Assets assigned for invoice: ${updatedInvoice.invoiceNumber}`,
        );
      }

      this.logger.log(
        `[Webhook] Payment processed successfully for invoice: ${updatedInvoice.invoiceNumber}`,
      );
      // Asignar assets
      if (updatedInvoice.assets?.length) {
        await this.invoicesService.assignAssets(updatedInvoice._id.toString());
        this.logger.log(
          `[Webhook] Assets assigned for invoice: ${updatedInvoice.invoiceNumber}`,
        );
      }

      this.logger.log(
        `[Webhook] Payment processed successfully for invoice: ${updatedInvoice.invoiceNumber}`,
      );

      return {
        success: true,
        invoice: updatedInvoice,
        message: "Payment processed successfully",
      };
    } catch (error: any) {
      this.logger.error(
        `[Webhook] Error processing webhook: ${error?.message ?? error}`,
      );
      throw error;
    }
  }

  /**
   * Handle manual payment confirmation
   */
  async handleManualConfirmation(
    transactionId: string,
    clientTransactionId: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `[Manual] Confirming payment manually - ID: ${transactionId}`,
      );

      const confirmation = await this.confirmPaymentStatus(
        transactionId,
        clientTransactionId,
      );

      const invoice =
        await this.invoicesService.findByTransactionId(transactionId);
      if (!invoice) {
        throw new BadRequestException("Invoice not found for this transaction");
      }

      const updatedInvoice = await this.invoicesService.processPayment(
        invoice.invoiceNumber,
        confirmation.transactionId,
        confirmation.clientTransactionId,
      );

      return {
        success: true,
        invoice: updatedInvoice,
      };
    } catch (error: any) {
      this.logger.error(
        `[Manual] Error confirming payment: ${error?.message ?? error}`,
      );
      throw error;
    }
  }

  /**
   * Generate payment HTML for Payphone button
   */
  generatePaymentHTML(
    invoiceNumber: string,
    amount: number,
    clientEmail: string,
  ): {
    storeId: string;
    reference: string;
    amount: number;
    email: string;
  } {
    return {
      storeId: this.payphoneStoreId,
      reference: invoiceNumber,
      amount,
      email: clientEmail,
    };
  }
}
