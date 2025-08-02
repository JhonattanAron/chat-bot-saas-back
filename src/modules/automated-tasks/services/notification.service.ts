import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class NotificationService {
  constructor(private readonly configService: ConfigService) {}

  async sendNotification(
    message: string,
    userId: string,
    type = "info"
  ): Promise<any> {
    try {
      console.log(`Sending notification to user ${userId}: ${message}`);

      // Aquí puedes integrar con servicios como:
      // - Slack
      // - Discord
      // - Telegram
      // - Push notifications
      // - SMS
      // - etc.

      // Por ahora, solo loggeamos la notificación
      const notification = {
        userId,
        message,
        type,
        timestamp: new Date(),
        sent: true,
      };

      // En una implementación real, aquí enviarías la notificación
      // await this.sendSlackNotification(message);
      // await this.sendDiscordNotification(message);
      // await this.sendPushNotification(userId, message);

      return notification;
    } catch (error) {
      console.error(`Error sending notification:`, error);
      throw error;
    }
  }

  async sendSlackNotification(message: string): Promise<any> {
    const webhookUrl = this.configService.get("SLACK_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("Slack webhook URL not configured");
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          username: "AutomatedTaskBot",
          icon_emoji: ":robot_face:",
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      return { success: true, platform: "slack" };
    } catch (error) {
      console.error("Error sending Slack notification:", error);
      throw error;
    }
  }

  async sendDiscordNotification(message: string): Promise<any> {
    const webhookUrl = this.configService.get("DISCORD_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("Discord webhook URL not configured");
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
          username: "AutomatedTaskBot",
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }

      return { success: true, platform: "discord" };
    } catch (error) {
      console.error("Error sending Discord notification:", error);
      throw error;
    }
  }
}
