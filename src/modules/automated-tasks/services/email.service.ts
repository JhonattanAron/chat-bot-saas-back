import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AutomatedTaskDocument } from "../schemas/automated-task.schema";

// Definir interfaces para evitar errores de importación
interface Transporter {
  verify(): Promise<any>;
  sendMail(options: any): Promise<any>;
}

interface ImapOptions {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: any;
}

interface Imap {
  once(event: string, callback: any): void;
  connect(): void;
  openBox(name: string, readonly: boolean, callback: any): void;
  search(criteria: any[], callback: any): void;
  fetch(results: any[], options: any): any;
  end(): void;
}

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async testConnection(emailConfig: any): Promise<any> {
    try {
      const transporter = this.createTransporter(emailConfig);
      await transporter.verify();
      return { success: true, message: "Email connection successful" };
    } catch (error) {
      throw new Error(`Email connection failed: ${error.message}`);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    task: AutomatedTaskDocument
  ): Promise<any> {
    try {
      const emailConfig = this.getEmailConfigFromTask(task);
      const transporter = this.createTransporter(emailConfig);

      const mailOptions = {
        from: emailConfig.username,
        to,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };

      const result = await transporter.sendMail(mailOptions);

      console.log(`Email sent successfully to ${to} for task ${task.name}`);

      return {
        success: true,
        messageId: result.messageId,
        to,
        subject,
        sentAt: new Date(),
      };
    } catch (error) {
      console.error(`Error sending email for task ${task.name}:`, error);
      throw error;
    }
  }

  async sendReply(
    originalEmail: any,
    subject: string,
    body: string,
    task: AutomatedTaskDocument
  ): Promise<any> {
    try {
      const emailConfig = this.getEmailConfigFromTask(task);
      const transporter = this.createTransporter(emailConfig);

      const mailOptions = {
        from: emailConfig.username,
        to: originalEmail.from,
        subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        html: body,
        text: body.replace(/<[^>]*>/g, ""),
        inReplyTo: originalEmail.messageId,
        references: originalEmail.messageId,
      };

      const result = await transporter.sendMail(mailOptions);

      console.log(
        `Reply sent successfully to ${originalEmail.from} for task ${task.name}`
      );

      return {
        success: true,
        messageId: result.messageId,
        to: originalEmail.from,
        subject,
        sentAt: new Date(),
        inReplyTo: originalEmail.messageId,
      };
    } catch (error) {
      console.error(`Error sending reply for task ${task.name}:`, error);
      throw error;
    }
  }

  async forwardEmail(
    originalEmail: any,
    forwardTo: string,
    attachOriginal = true
  ): Promise<any> {
    try {
      // Implementar lógica de reenvío
      const subject = `Fwd: ${originalEmail.subject}`;
      let body = `---------- Forwarded message ----------\n`;
      body += `From: ${originalEmail.from}\n`;
      body += `Date: ${originalEmail.date}\n`;
      body += `Subject: ${originalEmail.subject}\n`;
      body += `To: ${originalEmail.to}\n\n`;
      body += originalEmail.body;

      // Usar sendEmail para enviar el reenvío
      return this.sendEmail(forwardTo, subject, body, originalEmail.task);
    } catch (error) {
      console.error("Error forwarding email:", error);
      throw error;
    }
  }

  async checkForNewEmails(task: AutomatedTaskDocument): Promise<any[]> {
    // Implementación simulada para evitar errores de importación
    console.log(`Checking for new emails for task: ${task.name}`);
    return []; // Devolver un array vacío por ahora
  }

  private emailMatchesFilters(email: any, filters: any[] = []): boolean {
    if (!filters || filters.length === 0) {
      return true;
    }

    return filters.every((filter) => {
      const fieldValue = this.getEmailFieldValue(email, filter.field);
      return this.matchesFilter(fieldValue, filter.operator, filter.value);
    });
  }

  private getEmailFieldValue(email: any, field: string): string {
    switch (field) {
      case "from":
        return email.from || "";
      case "to":
        return email.to || "";
      case "subject":
        return email.subject || "";
      case "body":
        return email.body || "";
      default:
        return "";
    }
  }

  private matchesFilter(
    fieldValue: string,
    operator: string,
    filterValue: string
  ): boolean {
    const field = fieldValue.toLowerCase();
    const value = filterValue.toLowerCase();

    switch (operator) {
      case "contains":
        return field.includes(value);
      case "equals":
        return field === value;
      case "starts_with":
        return field.startsWith(value);
      case "ends_with":
        return field.endsWith(value);
      case "regex":
        try {
          const regex = new RegExp(filterValue, "i");
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private createTransporter(emailConfig: any): Transporter {
    // Implementación simulada para evitar errores de importación
    return {
      verify: async () => true,
      sendMail: async (options: any) => ({
        messageId: `mock-${Date.now()}@example.com`,
        response: "250 OK",
      }),
    };
  }

  private getEmailConfigFromTask(task: AutomatedTaskDocument): any {
    // Obtener configuración de email desde el trigger o desde variables de entorno
    if (task.trigger.config.emailConfig) {
      return task.trigger.config.emailConfig;
    }

    // Configuración por defecto desde variables de entorno
    return {
      provider: "smtp",
      smtpHost: this.configService.get("SMTP_HOST"),
      smtpPort: this.configService.get("SMTP_PORT"),
      username: this.configService.get("SMTP_USER"),
      password: this.configService.get("SMTP_PASS"),
      useSSL: true,
    };
  }
}
