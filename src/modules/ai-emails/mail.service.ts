import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MailLog } from "./schemas/mail-log.schema";
import { ChatService } from "../chat-model/chat/chat.service";
import { MailTemplateService } from "./services/mail-template.service";

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectModel(MailLog.name)
    private readonly mailLogModel: Model<MailLog>,
    private readonly chatService: ChatService,
    private readonly mailTemplateService: MailTemplateService
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    type: string;
    context: any;
    userId: string;
    entityId?: string; // <- agregar aquí
  }) {
    console.log(params.context);

    const prompt = this.mailTemplateService.createPromptTemplate(
      params.context
    );
    console.log(prompt);

    // Generar chat (predicción)
    const predict = await this.chatService.singlePredict(params.userId, prompt);
    console.log(predict);

    // Obtener solo el mensaje generado por el asistente
    const assistantMessage = predict.messages.find(
      (m) => m.role === "assistant"
    );

    if (!assistantMessage || !assistantMessage.content.trim()) {
      // No hay contenido generado, no enviamos email
      return { error: "No se generó contenido para el correo." };
    }

    const html = assistantMessage.content;

    // Enviar email con Resend
    const { data, error } = await this.resend.emails.send({
      from: process.env.MAIL_FROM!,
      to: params.to,
      subject: params.subject,
      html: this.mailTemplateService.createHtmlTemplate(html),
    });

    // Guardar log
    await this.mailLogModel.create({
      messageId: data?.id || "unknown",
      to: params.to,
      subject: params.subject,
      type: params.type,
      userId: params.userId,
      entityId: params.context.entityId,
      status: error ? "error" : "sent",
    });

    return { data, error };
  }
}
