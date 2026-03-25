import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { WebhookPaymentDto } from "../invoices/dto/invoice.dto";

@Controller("payments")
export class PaymentsController {
  private logger = new Logger(PaymentsController.name);

  constructor(private paymentsService: PaymentsService) {}

  /**
   * Webhook endpoint for Payphone payment confirmations
   * POST /api/webhooks/payphone
   */
  @Post("webhooks/payphone")
  async handlePaymentWebhook(
    @Body() webhookDto: WebhookPaymentDto,
  ): Promise<any> {
    try {
      this.logger.log("[Webhook] Received Payphone webhook");

      if (!webhookDto.id || !webhookDto.clientTxId) {
        throw new BadRequestException(
          "Missing required fields: id, clientTxId",
        );
      }

      const result =
        await this.paymentsService.processPaymentWebhook(webhookDto);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`[Webhook] Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Manual payment confirmation endpoint
   * POST /api/payments/confirm
   * Body: { id: string, clientTxId: string }
   */
  @Post("confirm")
  async confirmPayment(
    @Body()
    body: {
      transactionId: string;
      clientTransactionId: string;
      invoiceNumber: string;
    },
  ): Promise<any> {
    try {
      console.log(body);

      this.logger.log("[Confirm] Confirming payment manually");

      if (!body.transactionId || !body.clientTransactionId) {
        throw new BadRequestException(
          "Missing required fields: transactionId, clientTransactionId",
        );
      }

      const result = await this.paymentsService.handleManualConfirmation(
        body.transactionId,
        body.clientTransactionId,
        body.invoiceNumber,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`[Confirm] Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate payment parameters for frontend
   * POST /api/payments/generate
   */
  @Post("generate")
  async generatePaymentParams(
    @Body()
    body: {
      invoiceNumber: string;
      amount: number;
      email: string;
    },
  ): Promise<any> {
    try {
      this.logger.log(
        `[Generate] Generating payment params for ${body.invoiceNumber}`,
      );

      if (!body.invoiceNumber || !body.amount || !body.email) {
        throw new BadRequestException(
          "Missing required fields: invoiceNumber, amount, email",
        );
      }

      const params = this.paymentsService.generatePaymentHTML(
        body.invoiceNumber,
        body.amount,
        body.email,
      );

      return {
        success: true,
        data: params,
      };
    } catch (error) {
      this.logger.error(`[Generate] Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
