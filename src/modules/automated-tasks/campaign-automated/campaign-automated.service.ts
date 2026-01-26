import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MailService } from "src/modules/ai-emails/mail.service";
import { BatchesService } from "src/modules/batches/batches.service";
import { Batch } from "src/modules/batches/batches.schema";
import { Lead } from "src/modules/batches/lead.schema";
import { Campaign } from "./campaign.schema";

@Injectable()
export class CampaignsAutomatedService {
  constructor(
    private readonly batchesService: BatchesService,
    private readonly mailService: MailService,
    @InjectModel(Campaign.name)
    private campaignModel: Model<Campaign>,
  ) {}

  async runEmailCampaign(userId: string, searchQuery: string) {
    console.log("🚀 Iniciando campaña");

    // 1️⃣ Crear batch
    const batch = await this.batchesService.createBatch(userId, searchQuery);
    if (!batch?._id || batch.total_urls === 0)
      throw new Error("No se pudo crear el batch o el batch tiene 0 URLs");
    const batchId = batch._id.toString();

    // 2️⃣ Crear campaña
    const campaign = await this.campaignModel.create({
      userId,
      batchId,
      status: "created",
    });

    // 3️⃣ EXTRACCIÓN
    await this.campaignModel.findByIdAndUpdate(campaign._id, {
      status: "scraping",
    });

    while (true) {
      await this.batchesService.extractBatch(batchId);

      const pendientes = await this.batchesService.countLeads(
        batchId,
        "pending",
      );

      const extraidos = await this.batchesService.countLeads(
        batchId,
        "extracted",
      );

      await this.campaignModel.findByIdAndUpdate(campaign._id, {
        urls_procesadas: extraidos,
        informacion_extraida: extraidos,
      });

      if (pendientes === 0) break;
      await new Promise((r) => setTimeout(r, 5000));
    }

    await this.campaignModel.findByIdAndUpdate(campaign._id, {
      scraping_exitoso: true,
      status: "extracted",
    });

    // 4️⃣ NORMALIZACIÓN
    await this.campaignModel.findByIdAndUpdate(campaign._id, {
      status: "normalizing",
    });

    const leadsParaNormalizar =
      await this.batchesService.getExtractedLeadsWithEmails(batchId);

    await this.batchesService.normalizeEmailsWithAI(
      userId,
      batchId,
      leadsParaNormalizar.map((l) => ({
        leadId: l._id.toString(),
        emails: l.emails,
      })),
    );

    const emailsEncontrados = leadsParaNormalizar.reduce(
      (acc, l) => acc + (l.emails?.length || 0),
      0,
    );

    await this.campaignModel.findByIdAndUpdate(campaign._id, {
      emails_normalizados: true,
      emails_encontrados: emailsEncontrados,
    });

    // 5️⃣ ENVÍO
    await this.campaignModel.findByIdAndUpdate(campaign._id, {
      status: "sending",
    });

    const leadsFinales =
      await this.batchesService.getExtractedLeadsWithEmails(batchId);

    for (const lead of leadsFinales) {
      for (const email of lead.emails) {
        const res = await this.mailService.sendEmail({
          to: email,
          subject: `Idea para mejorar la captación de pacientes en ${lead.company_name}`,
          type: "custom",
          context: {
            empresa: lead.company_name,
            descripcion: lead.meta_description,
            razon: "Captación digital",
            nivel_interes: "medio",
          },
          userId,
          batch: batchId,
          entityId: lead.company_name,
        });

        if (res?.error) {
          await this.campaignModel.findByIdAndUpdate(campaign._id, {
            $inc: { "emails_enviados.incorrectos": 1 },
          });
        } else {
          await this.campaignModel.findByIdAndUpdate(campaign._id, {
            $inc: { "emails_enviados.correctos": 1 },
          });
        }
      }
    }

    // 6️⃣ FINAL
    await this.campaignModel.findByIdAndUpdate(campaign._id, {
      status: "completed",
    });

    return {
      campaignId: campaign._id,
      batchId,
    };
  }
}
