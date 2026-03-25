import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendClient: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY ?? "";
    if (!apiKey) {
      this.logger.warn(
        "RESEND_API_KEY undefined – email functions will be no-op",
      );
      this.resendClient = null;
      return;
    }

    this.resendClient = new Resend(apiKey);
  }

  async sendInvoiceCreated(
    invoice: any,
    client: { email: string; name: string },
  ): Promise<void> {
    if (!this.resendClient) return;

    try {
      await this.resendClient.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: client.email,
        subject: `Su factura #${invoice.invoiceNumber} está lista`,
        html: `
          <h1>Hola ${client.name}</h1>
          <p>Su factura <strong>#${invoice.invoiceNumber}</strong> ha sido creada.</p>
          <p>Total: <strong>$${invoice.total.toFixed(2)}</strong></p>
          <p>Puede verla en su <a href="${process.env.FRONTEND_URL}/dashboard/facturacion/order/${invoice.invoiceNumber}">cuenta</a>.</p>
        `,
      });
      this.logger.log(
        `Email de factura #${invoice.invoiceNumber} enviado a ${client.email}`,
      );
    } catch (err) {
      this.logger.error(
        `Error enviando email de factura #${invoice.invoiceNumber} a ${client.email}`,
        err,
      );
    }
  }
}
