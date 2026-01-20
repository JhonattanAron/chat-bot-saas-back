import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { MailService } from "./mail.service";
import { SendLeadsMailsDto } from "./dto/send-leads-mails.dto";

@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post("send-leads")
  async sendLeadsEmails(@Body() dto: SendLeadsMailsDto) {
    const results: Array<{
      empresa: string;
      email: string;
      status: "sent" | "error";
      messageId?: string;
      error?: string;
      userId?: string;
      batch: string | null;
    }> = [];

    for (const lead of dto.leads) {
      if (!lead.emails || lead.emails.length === 0) continue;

      for (const email of lead.emails) {
        try {
          const response = await this.mailService.sendEmail({
            to: email,
            subject: `Idea para mejorar la captación de pacientes en ${lead.empresa}`,
            type: "custom",
            context: {
              empresa: lead.empresa,
              descripcion: lead.descripcion,
              razon: lead.razon,
              nivel_interes: lead.nivel_interes,
            },
            entityId: lead.empresa,
            userId: lead.userId,
            batch: lead.batch, // ✅ pasar batch por lead
          });

          results.push({
            empresa: lead.empresa,
            email,
            status: "sent",
            messageId: response.data?.id,
            userId: lead.userId,
            batch: lead.batch ?? null, // ✅ batch por lead
          });
        } catch (err: any) {
          results.push({
            empresa: lead.empresa,
            email,
            status: "error",
            error: err.message || "Unknown error",
            userId: lead.userId,
            batch: lead.batch, // ✅ NO perder batch
          });
        }
      }
    }

    return {
      total: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    };
  }
  @Get("campaing/:userId")
  async getByUserId(@Param("userId") userId: string) {
    return this.mailService.findCampaingByUserId(userId);
  }
}
