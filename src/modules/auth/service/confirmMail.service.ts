import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: "Aurentric Labs<no-reply@mail.digitalprimesolutions.com>",
      to: email,
      subject: "Confirma tu correo electrónico",
      html: `
        <h2>Bienvenido 👋 a Aurentric Labs</h2>
        <p>Gracias por registrarte. Para confirmar tu correo haz clic en el siguiente botón:</p>
        <a href="${verifyUrl}" 
           style="padding:10px 15px; background:#000; color:#fff; text-decoration:none; border-radius:5px">
          Confirmar correo
        </a>
        <p>Si no creaste esta cuenta, ignora este mensaje.</p>
      `,
    });
  }
}
