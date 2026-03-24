import * as crypto from 'crypto';

export class CryptoUtil {
  /**
   * Generate an integrity hash for an invoice
   * Hash is created from: invoiceNumber + status + total
   * This prevents tampering with critical invoice data
   */
  static generateIntegrityHash(
    invoiceNumber: string,
    status: string,
    total: number,
  ): string {
    const data = `${invoiceNumber}:${status}:${total}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify integrity hash matches current invoice state
   */
  static verifyIntegrityHash(
    invoiceNumber: string,
    status: string,
    total: number,
    hash: string,
  ): boolean {
    const expectedHash = this.generateIntegrityHash(
      invoiceNumber,
      status,
      total,
    );
    return expectedHash === hash;
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    return expectedSignature === signature;
  }

  /**
   * Generate unique reference/order ID for payments
   */
  static generatePaymentReference(invoiceNumber: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString('hex');
    return `${invoiceNumber}-${timestamp}-${random}`;
  }
}
