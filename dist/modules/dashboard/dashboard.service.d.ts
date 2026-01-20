import type { DashboardStatsResponse, TokenUsage, Bot } from "./dto/update-dashboard-stats.dto";
export declare class DashboardService {
    private chatModel;
    private assistantChatModel;
    private userModel;
    private dashboardStatsModel;
    private telegramChatModel;
    constructor();
    syncCurrentStats(userId: string): Promise<void>;
    incrementBotCreated(userId: string): Promise<void>;
    getDashboardStats(userId: string): Promise<DashboardStatsResponse>;
    getTokenUsage(userId: string): Promise<TokenUsage>;
    getUserBots(userId: string): Promise<Bot[]>;
    getAnalytics(userId: string): Promise<{
        daily_messages: never[];
        bot_performance: {
            bot_name: string;
            messages: number;
            success_rate: number;
        }[];
    }>;
    addTokenUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void>;
}
