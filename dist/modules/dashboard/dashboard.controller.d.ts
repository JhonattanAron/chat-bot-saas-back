import { DashboardService } from "./dashboard.service";
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardStats(userId: string): Promise<import("./dto/update-dashboard-stats.dto").DashboardStatsResponse>;
    getUserBots(userId: string): Promise<import("./dto/update-dashboard-stats.dto").Bot[]>;
    getTokenUsage(userId: string): Promise<import("./dto/update-dashboard-stats.dto").TokenUsage>;
    getAnalytics(userId: string): Promise<{
        daily_messages: never[];
        bot_performance: {
            bot_name: string;
            messages: number;
            success_rate: number;
        }[];
    }>;
}
