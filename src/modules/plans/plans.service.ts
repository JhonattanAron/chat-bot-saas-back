import { Injectable } from "@nestjs/common";
import type { Model } from "mongoose";
import type { StickReferencesDocument } from "./stick-references.schema";
import * as crypto from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import { StickReferences } from "./stick-references.schema";
import { Cron } from "@nestjs/schedule";

export type BillingCycle = "monthly" | "yearly";

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

  // =========================
  // PLAN DEFINITIONS
  // =========================
  private readonly plans: Record<string, PlanLimits> = {
    basico: {
      name: "Básico",
      max_tokens: 10_000_000,
      max_conversations_month: 240,
      max_conversations_day: 8,
      max_chatbots: 1,
      tokens_per_conversation: 40_000,
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
      max_tokens: 23_000_000,
      max_conversations_month: 570,
      max_conversations_day: 19,
      max_chatbots: 2,
      tokens_per_conversation: 40_000,
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
      max_tokens: 60_000_000,
      max_conversations_month: 1500,
      max_conversations_day: 50,
      max_chatbots: 5,
      tokens_per_conversation: 40_000,
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
      max_tokens: 140_000_000,
      max_conversations_month: 3480,
      max_conversations_day: 116,
      max_chatbots: -1,
      tokens_per_conversation: 40_000,
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
    private readonly stickReferencesModel: Model<StickReferencesDocument>,
  ) {}

  // =========================
  // ENCRYPT / DECRYPT
  // =========================
  private encryptPlan(payload: string): string {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted =
      cipher.update(payload, "utf8", "hex") + cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
  }

  private decryptPlan(encryptedPlan: string): string {
    try {
      const algorithm = "aes-256-cbc";
      const key = crypto.scryptSync(this.encryptionKey, "salt", 32);

      const [ivHex, encrypted] = encryptedPlan.split(":");
      const iv = Buffer.from(ivHex, "hex");

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    } catch {
      return "basico:monthly";
    }
  }

  // =========================
  // CENTRAL PARSER (CLAVE)
  // =========================
  private parseEncryptedPlan(reference: string): {
    planKey: string;
    billingCycle: BillingCycle;
  } {
    const decrypted = this.decryptPlan(reference);
    const [planKey, billingCycle] = decrypted.split(":");

    return {
      planKey: this.plans[planKey] ? planKey : "basico",
      billingCycle: billingCycle === "yearly" ? "yearly" : "monthly",
    };
  }

  // =========================
  // ASSIGN PLAN
  // =========================
  async assignPlanToUser(
    userId: string,
    planName: string,
    billingCycle: BillingCycle,
  ): Promise<StickReferencesDocument> {
    await this.stickReferencesModel.updateMany(
      { user_id: userId, is_active: true },
      { is_active: false },
    );

    const encryptedReference = this.encryptPlan(`${planName}:${billingCycle}`);

    const expiresAt = new Date();
    billingCycle === "yearly"
      ? expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      : expiresAt.setMonth(expiresAt.getMonth() + 1);

    return new this.stickReferencesModel({
      user_id: userId,
      reference: encryptedReference,
      billing_cycle: billingCycle,
      is_active: true,
      expires_at: expiresAt,
    }).save();
  }

  // =========================
  // GET USER PLAN
  // =========================
  async getUserPlan(
    userId: string,
  ): Promise<{ plan: PlanLimits; reference: StickReferencesDocument } | null> {
    const ref = await this.stickReferencesModel.findOne({
      user_id: userId,
      is_active: true,
      expires_at: { $gt: new Date() },
    });

    if (!ref) return null;

    const parsed = this.parseEncryptedPlan(ref.reference);

    // autocorrección si tocaron la DB
    if (ref.billing_cycle !== parsed.billingCycle) {
      ref.billing_cycle = parsed.billingCycle;
      await ref.save();
    }

    return {
      plan: this.plans[parsed.planKey],
      reference: ref,
    };
  }

  // =========================
  // LIMIT CHECK
  // =========================
  async checkUserLimits(userId: string) {
    const data = await this.getUserPlan(userId);

    if (!data) {
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

    const unlimited = data.plan.max_chatbots === -1;

    return {
      canCreateBot: unlimited || currentBots < data.plan.max_chatbots,
      canSendMessage: usedTokens < data.plan.max_tokens,
      remainingTokens: data.plan.max_tokens - usedTokens,
      remainingBots: unlimited ? -1 : data.plan.max_chatbots - currentBots,
      currentPlan: data.plan.name,
    };
  }

  // =========================
  // PUBLIC
  // =========================
  getAllPlans() {
    return this.plans;
  }

  // =========================
  // CRON — EXPIRE PLANS
  // =========================
  @Cron("0 0 * * *")
  async deactivateExpiredPlans() {
    const result = await this.stickReferencesModel.updateMany(
      { is_active: true, expires_at: { $lte: new Date() } },
      { is_active: false },
    );

    console.log(
      `[CRON] Planes expirados desactivados: ${result.modifiedCount}`,
    );

    return result;
  }
}
