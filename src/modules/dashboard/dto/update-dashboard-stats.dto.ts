// src/dashboard/dto/update-dashboard-stats.dto.ts
export interface DashboardStatsResponse {
  total_bots: number;
  total_messages: number;
  active_users: number;
  conversion_rate: number;
  bots_change: string;
  messages_change: string;
  users_change: string;
  conversion_change: string;
}

export interface DashboardStatsUpdate {
  input_tokens?: number;
  output_tokens?: number;
  conversations?: number;
  messages?: number;
  bots_created?: number;
  bots_deleted?: number;
}

export interface Bot {
  id: string;
  name: string;
  status: "online" | "offline" | "maintenance";
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  max_tokens: number;
  usage_percentage: number;
}
