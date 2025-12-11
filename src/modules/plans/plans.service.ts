import { Injectable } from "@nestjs/common";
import type { Model } from "mongoose";
import type { StickReferencesDocument } from "./stick-references.schema";
import * as crypto from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import { StickReferences } from "./stick-references.schema";

export interface PlanLimits {
  name: string;
  max_tokens: number;
  max_conversations_month: number;
  max_conversations_day: number;
  max_chatbots: number;
  tokens_per_conversation: number;
  cost_per_token: number;
  features: string[];
}

@Injectable()
export class PlansService {
  private readonly encryptionKey =
    process.env.PLAN_ENCRYPTION_KEY || "default-key-change-in-production";

  private readonly plans: Record<string, PlanLimits> = {
    basico: {
      name: "Básico",
      max_tokens: 10000000,
      max_conversations_month: 240,
      max_conversations_day: 8,
      max_chatbots: 1,
      tokens_per_conversation: 40000,
      cost_per_token: 0.0000005,
      features: [
        "1 chatbot activo",
        "Integración web básica",
        "Respuestas automáticas",
        "Personalización básica",
        "Soporte por email",
      ],
    },
    estandar: {
      name: "Estándar",
      max_tokens: 23000000,
      max_conversations_month: 570,
      max_conversations_day: 19,
      max_chatbots: 2,
      tokens_per_conversation: 40000,
      cost_per_token: 0.00000039,
      features: [
        "2 chatbots activos",
        "Integración web completa",
        "Integración WhatsApp Business",
        "Personalización avanzada",
        "Soporte prioritario",
        "Analíticas básicas",
      ],
    },
    avanzado: {
      name: "Avanzado",
      max_tokens: 60000000,
      max_conversations_month: 1500,
      max_conversations_day: 50,
      max_chatbots: 5,
      tokens_per_conversation: 40000,
      cost_per_token: 0.00000037,
      features: [
        "5 chatbots activos",
        "Integraciones personalizadas",
        "API básica",
        "Personalización completa",
        "Soporte prioritario",
        "Analíticas detalladas",
        "Entrenamiento básico",
      ],
    },
    pro: {
      name: "Pro",
      max_tokens: 140000000,
      max_conversations_month: 3480,
      max_conversations_day: 116,
      max_chatbots: -1,
      tokens_per_conversation: 40000,
      cost_per_token: 0.00000032,
      features: [
        "Chatbots ilimitados",
        "Integraciones avanzadas",
        "API completa",
        "Personalización total",
        "Soporte 24/7 dedicado",
        "Analíticas avanzadas",
        "Entrenamiento personalizado",
      ],
    },
  };

  constructor(
    @InjectModel(StickReferences.name)
    private stickReferencesModel: Model<StickReferencesDocument>
  ) {}

  private encryptPlan(planName: string): string {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(planName, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  private decryptPlan(encryptedPlan: string): string {
    try {
      const algorithm = "aes-256-cbc";
      const key = crypto.scryptSync(this.encryptionKey, "salt", 32);

      const parts = encryptedPlan.split(":");
      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      return "basico";
    }
  }

  async assignPlanToUser(
    userId: string,
    planName: string
  ): Promise<StickReferencesDocument> {
    await this.stickReferencesModel.updateMany(
      { user_id: userId, is_active: true },
      { is_active: false }
    );

    const encryptedReference = this.encryptPlan(planName);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const newReference = new this.stickReferencesModel({
      user_id: userId,
      reference: encryptedReference,
      is_active: true,
      expires_at: expiresAt,
    });

    return await newReference.save();
  }

  async getUserPlan(
    userId: string
  ): Promise<{ plan: PlanLimits; reference: StickReferencesDocument } | null> {
    const activeReference = await this.stickReferencesModel.findOne({
      user_id: userId,
      is_active: true,
      expires_at: { $gt: new Date() },
    });

    if (!activeReference) {
      return null;
    }

    const planName = this.decryptPlan(activeReference.reference);
    const plan = this.plans[planName] || this.plans["basico"];

    return { plan, reference: activeReference };
  }

  async checkUserLimits(userId: string): Promise<{
    canCreateBot: boolean;
    canSendMessage: boolean;
    remainingTokens: number;
    remainingBots: number;
    currentPlan: string;
  }> {
    const userPlan = await this.getUserPlan(userId);

    if (!userPlan) {
      return {
        canCreateBot: false,
        canSendMessage: false,
        remainingTokens: 0,
        remainingBots: 0,
        currentPlan: "ninguno",
      };
    }

    const currentBots = 0;
    const usedTokens = 0;

    const canCreateBot =
      userPlan.plan.max_chatbots === -1 ||
      currentBots < userPlan.plan.max_chatbots;
    const remainingTokens = userPlan.plan.max_tokens - usedTokens;
    const canSendMessage = remainingTokens > 0;

    return {
      canCreateBot,
      canSendMessage,
      remainingTokens,
      remainingBots:
        userPlan.plan.max_chatbots === -1
          ? -1
          : userPlan.plan.max_chatbots - currentBots,
      currentPlan: userPlan.plan.name,
    };
  }

  getAllPlans(): Record<string, PlanLimits> {
    return this.plans;
  }
}
