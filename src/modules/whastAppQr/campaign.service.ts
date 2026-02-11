import { Injectable, Logger } from "@nestjs/common";
import { Model } from "mongoose";
import { ChatService } from "src/modules/chat-model/chat/chat.service";
import { WhatsappService } from "./whatsapp.service";
import {
  CampaignMessage,
  CampaignMessageDocument,
} from "./schemas/campaign-message.schema";
import { InjectModel } from "@nestjs/mongoose";
import { CampaignDocument } from "../automated-tasks/campaign-automated/campaign.schema";
import {
  WhastAppCampaign,
  WhastAppCampaignDocument,
} from "./schemas/campaign.schema";

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectModel(WhastAppCampaign.name)
    private campaignModel: Model<WhastAppCampaignDocument>,
    @InjectModel(CampaignMessage.name)
    private campaignMessageModel: Model<CampaignMessageDocument>,
    private readonly chatService: ChatService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async createCampaignAndSend(
    userId: string,
    assistantId: string,
    name: string,
    description: string,
    messageTemplate: string, // 👈 ES EL PROMPT BASE
    contacts: { name?: string; phone: string }[],
  ) {
    console.log(userId);

    // 1️⃣ Crear campaña
    const campaign = new this.campaignModel({
      user_id: userId,
      assistant_id: assistantId,
      name,
      description,
      message_template: messageTemplate,
      contact_numbers: contacts.map((c) => c.phone),
      messages_sent: 0,
      messages_failed: 0,
      messages_delivered: 0,
    });

    const savedCampaign = await campaign.save();
    this.logger.log(`🚀 Campaign creada ${savedCampaign._id}`);

    // 2️⃣ Envío secuencial (ANTI BAN)
    // 2️⃣ Envío secuencial (ANTI BAN)
    for (const contact of contacts) {
      try {
        const prompt = `
Eres un asistente comercial experto.

Cliente:
- Nombre: ${contact.name || "Cliente"}
- Teléfono: ${contact.phone}

Instrucción principal:
${messageTemplate}

Reglas:
- Mensaje corto
- Natural
- Cercano
- No agresivo
- No spam
`;

        // Generar mensaje
        const chat = await this.chatService.singlePredict(userId, prompt);
        const finalMessage = chat.messages[1]?.content;

        if (!finalMessage || !finalMessage.trim()) {
          throw new Error(`IA no generó mensaje válido para ${contact.phone}`);
        }

        // Enviar WhatsApp
        await this.whatsappService.sendMessage(
          userId,
          contact.phone,
          finalMessage,
        );

        // Guardar mensaje enviado SOLO UNA VEZ
        await this.campaignMessageModel.create({
          campaign_id: savedCampaign._id,
          phone_number: contact.phone,
          message_content: finalMessage.trim(),
          status: "sent",
          sent_at: new Date(),
        });

        savedCampaign.messages_sent += 1;
        await savedCampaign.save();

        this.logger.log(`✅ Enviado a ${contact.phone}`);
      } catch (error: any) {
        await this.campaignMessageModel.create({
          campaign_id: savedCampaign._id,
          phone_number: contact.phone,
          message_content: "ERROR", // mensaje vacío para fallo
          status: "failed",
          error_message: error.message,
        });

        savedCampaign.messages_failed += 1;
        await savedCampaign.save();

        this.logger.error(`❌ Error enviando a ${contact.phone}`, error);
      }
    }

    return {
      status: "ok",
      campaignId: savedCampaign._id,
      sent: savedCampaign.messages_sent,
      failed: savedCampaign.messages_failed,
    };
  }

  async getCampaignsByUser(userId: string) {
    return this.campaignModel
      .find({ user_id: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCampaignById(campaignId: string) {
    return this.campaignModel.findById(campaignId).exec();
  }

  async getCampaignMessages(campaignId: string) {
    return this.campaignMessageModel.find({ campaign_id: campaignId }).exec();
  }

  async updateCampaignMessageStatus(
    messageId: string,
    status: string,
    deliveredAt?: Date,
  ) {
    return this.campaignMessageModel
      .findByIdAndUpdate(
        messageId,
        { status, delivered_at: deliveredAt },
        { new: true },
      )
      .exec();
  }
}
