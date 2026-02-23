import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { SendMailDto } from "./dto/send-mail.dto";
import { CreateDomainDto } from "./dto/create-domain.dto";

interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  sentAt: Date;
  status: "sent" | "failed";
}

interface DomainRecord {
  id: string;
  name: string;
  verified: boolean;
  createdAt: Date;
}

@Injectable()
export class MailService {
  private emailHistory: EmailRecord[] = [];
  private domains: DomainRecord[] = [];
  constructor() {}

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const resend = new Resend(apiKey);
      // Test the API key with a simple call
      await resend.domains.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendEmail(
    apiKey: string,
    dto: SendMailDto,
  ): Promise<{ id: string; status: string }> {
    try {
      const resend = new Resend(apiKey);

      const response = await resend.emails.send({
        from: "noreply@resend.dev",
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Add to history
      const record: EmailRecord = {
        id: response.data?.id || "",
        to: dto.to,
        subject: dto.subject,
        sentAt: new Date(),
        status: "sent",
      };

      this.emailHistory.unshift(record);
      if (this.emailHistory.length > 50) {
        this.emailHistory.pop();
      }

      console.debug(`Email sent to ${dto.to}`);

      return {
        id: response.data?.id || "",
        status: "success",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Add failed record to history
      const record: EmailRecord = {
        id: "",
        to: dto.to,
        subject: dto.subject,
        sentAt: new Date(),
        status: "failed",
      };

      this.emailHistory.unshift(record);
      if (this.emailHistory.length > 50) {
        this.emailHistory.pop();
      }

      console.error(`Failed to send email: ${errorMessage}`);
      throw new BadRequestException(`Failed to send email: ${errorMessage}`);
    }
  }

  async getEmailHistory(): Promise<EmailRecord[]> {
    return this.emailHistory.slice(0, 50);
  }

  async listDomains(apiKey: string) {
    try {
      const resend = new Resend(apiKey);
      const response = await resend.domains.list();

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data; // <- aquí está el array real
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      throw new BadRequestException(`Failed to list domains: ${errorMessage}`);
    }
  }

  async createDomain(apiKey: string, dto: CreateDomainDto): Promise<any> {
    try {
      const resend = new Resend(apiKey);

      const response = await resend.domains.create({
        name: dto.name, // ← CORRECTO
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const domainRecord: DomainRecord = {
        id: response.data?.id ?? "",
        name: dto.name,
        verified: false,
        createdAt: new Date(),
      };

      this.domains.push(domainRecord);

      return {
        id: response.data?.id,
        domain: dto.name,
        records: response.data?.records ?? [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      throw new BadRequestException(`Failed to create domain: ${errorMessage}`);
    }
  }

  clearHistory(): void {
    this.emailHistory = [];
    this.domains = [];
    console.debug("History cleared");
  }
}
