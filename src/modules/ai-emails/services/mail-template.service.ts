// mail-template.service.ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailTemplateService {
  /**
   * Crea la plantilla HTML completa con contenido dinámico insertado
   * @param content HTML o texto generado dinámicamente (por IA u otro)
   * @returns plantilla HTML completa con contenido inyectado
   */
  createHtmlTemplate(content: string): string {
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
                  </td>
                </tr>

                <!-- FOOTER FIJO -->
                <tr>
  <td
    style="
      background-color: #f1f5f9;
      padding: 20px 16px;
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      font-family: Arial, sans-serif;
    "
  >
    <p style="margin: 0 0 8px;">
      Agencia de Marketing Digital · Google Partner
    </p>
    <p style="margin: 0 0 12px;">
      📍 Girona · Madrid · Barcelona
    </p>
    <div style="display: inline-flex; gap: 10px; justify-content: center;">
      <a href="https://wa.me/34639245923" target="_blank" style="background-color:#25D366; color:#fff; text-decoration:none; padding:8px 14px; border-radius:5px; font-weight:bold; font-size:14px;">
        📱 WhatsApp
      </a>
      <a href="mailto:info@digitalprimesolutions.com" style="background-color:#0072C6; color:#fff; text-decoration:none; padding:8px 14px; border-radius:5px; font-weight:bold; font-size:14px;">
        📧 Email
      </a>
      <a href="https://digitalprimesolutions.com" target="_blank" style="background-color:#4CAF50; color:#fff; text-decoration:none; padding:8px 14px; border-radius:5px; font-weight:bold; font-size:14px;">
        🌐 Web
      </a>
    </div>
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

  createPromptTemplate(context: object): string {
    const contextString = JSON.stringify(context, null, 2);
    const prompt = `
Genera únicamente el contenido HTML para un correo dirigido a una empresa, que será el correo final listo para enviar, sin textos genéricos ni placeholders. Usa directamente los datos reales de la empresa y su análisis.

El correo debe tener un tono profesional, cercano y persuasivo, como si fuera escrito por Luis, CEO de Digital Prime Solutions. Incluye emojis relevantes para destacar puntos importantes y hacer el correo más atractivo visualmente y amigable.

Usa la siguiente información del análisis y los servicios que ofrece la empresa para construir un correo completo, claro y enfocado en mostrar valor y motivar a la acción.

Información de la empresa:
${contextString}

Servicios y precios que ofrece Digital Prime Solutions:

- SEO: 600 €/MES  
- SOCIAL ADS: 550 €/MES  
- PÁGINA WEB: 700 €/MES  
- MANTENIMIENTO WEB: 50 €/MES  
- GOOGLE ADS: 600 €/MES  
- CONTENIDO Y PRODUCCIÓN (CREACIÓN): 650 €  
- LANDING PAGE: 300 €  
- ASESORÍA/MENTORÍA: 50 $  
- AUTOMATIZACIONES CON IA MEDIANTE CHAT: 150 €/MES  
- ASISTENTE TELEFÓNICO INTELIGENTE CON IA: 450 €/MES  
- SKRAPING + CAMPAÑAS DE CORREOS PERSONALIZADOS CON IA: 150 €/MES  

Paquetes:

1. PAQUETE DE VISIBILIDAD BÁSICO (950 €/MES)
   - SEO
   - Optimización perfil Google My Business (posicionamiento local)
   - Campañas de Google Ads

2. PAQUETE GROWTH (1250 €/MES)
   - SEO
   - Optimización perfil Google My Business (posicionamiento local)
   - Campañas de Google Ads
   - Meta Ads

3. PAQUETE COMPLETO (1650 €/MES) — Ahorro de 750 €/MES
   - SEO
   - Optimización perfil Google My Business (posicionamiento local)
   - Campañas de Google Ads
   - Meta Ads
   - Creación de contenido (gestión de redes sociales)

Contenido que debe incluir el correo:

- Un saludo cordial personalizado con el nombre real de la empresa.
- Una introducción natural mencionando que Luis, CEO de Digital Prime Solutions, realizó un análisis y comprende la situación de la clínica.
- Explicación clara y amigable de por qué la clínica necesita servicios digitales y SEO, con emojis para enfatizar beneficios.
- Descripción de cómo los servicios y paquetes pueden ayudar, destacando puntos clave con emojis.
- Invitar a la acción amable para contactar y explorar las opciones.
- Un cierre profesional firmado por Luis SEO.
- destaca servicios como los de IA, automatizaciones y asistentes telefónicos inteligentes PUEDEN AGENDAR CITAS , RESPONDER LLAMDAS HASTA AHORRAR 8 HORAS SEMANALES DE TRABAJO HUMANO.

Utiliza solo etiquetas HTML adecuadas para email: <h1>, <h2>, <p>, <ul>, <li>, etc.

Genera solo el contenido HTML final, sin texto explicativo ni placeholders, con datos reales ya insertados y en formato listo para enviar.
`;
    return prompt;
  }
}
