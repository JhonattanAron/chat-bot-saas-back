"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailTemplateService = void 0;
const common_1 = require("@nestjs/common");
let MailTemplateService = class MailTemplateService {
    createHtmlTemplate(content) {
        const template = `
    <!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Digital Prime Solutions</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #0000;
      font-family: Arial, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 22px">
      <tr>
        <td align="center">
          <table
            cellpadding="0"
            cellspacing="0"
            style="
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            "
          >
            <!-- HEADER FIJO -->
            <tr>
              <td
                align="center"
                style="background-color: #333333; padding: 24px"
              >
                <img
                  src="https://i.imgur.com/0oINgk3.png"
                  alt="Digital Prime Solutions"
                  width="100"
                />
              </td>
            </tr>

            <!-- CONTENIDO DINÁMICO -->
            <tr>
              <td style="padding: 26px; color: #333333">
                ${content}

                <!-- BOTONES DE CONTACTO -->
                <div style="margin-top: 24px; text-align: center">
                  <div
                    style="
                      display: inline-flex;
                      gap: 10px;
                      justify-content: center;
                      flex-wrap: wrap;
                    "
                  >
                    <a
                      href="https://wa.me/34639245923"
                      target="_blank"
                      style="
                        background-color: #25d366;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 10px 16px;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;
                      "
                    >
                      📱 WhatsApp
                    </a>

                    <a
                      href="mailto:info@digitalprimesolutions.com"
                      style="
                        background-color: #0072c6;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 10px 16px;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;
                      "
                    >
                      📧 Email
                    </a>

                    <a
                      href="https://digitalprimesolutions.com"
                      target="_blank"
                      style="
                        background-color: #4caf50;
                        color: #ffffff;
                        text-decoration: none;
                        padding: 10px 16px;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;
                      "
                    >
                      🌐 Web
                    </a>
                  </div>
                </div>
              </td>
            </tr>

            <!-- FOOTER FIJO -->
            <tr>
              <td
                style="
                  background-color: #f1f5f9;
                  padding: 16px;
                  text-align: center;
                  font-size: 13px;
                  color: #6b7280;
                  font-family: Arial, sans-serif;
                "
              >
                <p style="margin: 0 0 6px">
                  Agencia de Marketing Digital · Google Partner
                </p>
                <p style="margin: 0">📍 Girona · Madrid · Barcelona</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

    `;
        return template;
    }
    createPromptTemplate(context) {
        const contextString = JSON.stringify(context, null, 2);
        const prompt = `
Genera únicamente el contenido HTML final de un correo listo para enviar.

El correo DEBE:
- Estar escrito en segunda persona (tuteo): usa "tú", "tu negocio", "tu presencia digital".
- Sonar humano, cercano y natural, como una conversación real.
- Evitar completamente lenguaje corporativo, robótico o excesivamente técnico.
- No incluir precios, cifras económicas ni referencias a costos.
- No usar placeholders ni textos genéricos.
- No mencionar que es un "análisis automatizado" o generado por IA.
- Mencionar de forma natural que, si se llega a un acuerdo, Digital Prime Solutions trabaja con exclusividad por zona o área geográfica, 
  para no colaborar con competidores directos del negocio.
- Esta mención debe sonar como un valor añadido y una ventaja estratégica, 
  no como una condición legal ni una imposición.


El correo debe parecer escrito por Luis, CEO de Digital Prime Solutions, hablando directamente con el responsable del negocio.

Usa la información real del análisis para personalizar el mensaje.

Información del negocio analizado:
${contextString}

Servicios que ofrece Digital Prime Solutions (usar solo para construir el mensaje, NO listar ni mencionar precios):

- SEO y posicionamiento en Google
- Optimización de Google My Business (visibilidad local)
- Campañas en Google Ads y Meta Ads
- Creación y optimización de páginas web
- Automatizaciones con IA mediante chat 🤖
- Asistente telefónico inteligente con IA 📞
- Sistemas que pueden agendar citas automáticamente
- Soluciones que pueden ahorrar hasta 8 horas semanales de trabajo humano

El correo debe incluir:

- Un saludo cercano usando el nombre real del negocio.
- Una apertura cálida y humana, por ejemplo:
  "Soy Luis Caritg, un placer saludarte. Hemos hecho un análisis de tu presencia digital y vemos una oportunidad clara de mejora..."
- Explicación sencilla de los puntos detectados y cómo están afectando la captación de clientes.
- Beneficios explicados de forma clara, usando emojis con moderación.
- Mención de soluciones con IA como una ventaja moderna y práctica.
- Invitación a conversar sin presión (llamada, WhatsApp o respuesta directa).
- Cierre cercano y firma de Luis.

Usa únicamente etiquetas HTML compatibles con email:
<h1>, <h2>, <p>, <ul>, <li>, <strong>

Genera SOLO el HTML final del correo puedes agregar emojis negrita para que sea mas amigable, sin explicaciones ni texto adicional.
`;
        return prompt;
    }
};
exports.MailTemplateService = MailTemplateService;
exports.MailTemplateService = MailTemplateService = __decorate([
    (0, common_1.Injectable)()
], MailTemplateService);
//# sourceMappingURL=mail-template.service.js.map