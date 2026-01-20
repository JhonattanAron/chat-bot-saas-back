import { PlansService } from "./plans.service";
export declare class PlansController {
    private readonly plansService;
    constructor(plansService: PlansService);
    getAvailablePlans(): {
        success: boolean;
        data: Record<string, import("./plans.service").PlanLimits>;
    };
    assignPlan(body: {
        userId: string;
        planName: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("./stick-references.schema").StickReferencesDocument;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getUserPlan(body: {
        userId: string;
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        data: {
            plan: import("./plans.service").PlanLimits;
            expires_at: Date;
            created_at: Date;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    getUserLimits(body: {
        userId: string;
    }): Promise<{
        success: boolean;
        data: {
            canCreateBot: boolean;
            canSendMessage: boolean;
            remainingTokens: number;
            remainingBots: number;
            currentPlan: string;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
}
