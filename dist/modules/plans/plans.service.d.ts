import type { Model } from "mongoose";
import type { StickReferencesDocument } from "./stick-references.schema";
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
export declare class PlansService {
    private stickReferencesModel;
    private readonly encryptionKey;
    private readonly plans;
    constructor(stickReferencesModel: Model<StickReferencesDocument>);
    private encryptPlan;
    private decryptPlan;
    assignPlanToUser(userId: string, planName: string): Promise<StickReferencesDocument>;
    getUserPlan(userId: string): Promise<{
        plan: PlanLimits;
        reference: StickReferencesDocument;
    } | null>;
    checkUserLimits(userId: string): Promise<{
        canCreateBot: boolean;
        canSendMessage: boolean;
        remainingTokens: number;
        remainingBots: number;
        currentPlan: string;
    }>;
    getAllPlans(): Record<string, PlanLimits>;
}
