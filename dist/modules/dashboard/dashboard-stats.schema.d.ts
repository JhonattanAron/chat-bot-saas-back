import { Document } from "mongoose";
export type DashboardStatsDocument = DashboardStats & Document;
export declare class DashboardStats {
    user_id: string;
    total_input_tokens: number;
    total_output_tokens: number;
    monthly_input_tokens: number;
    monthly_output_tokens: number;
    total_bots_created: number;
    active_bots: number;
    deleted_bots: number;
    total_conversations: number;
    monthly_conversations: number;
    total_messages: number;
    monthly_messages: number;
    unique_users_interacted: number;
    last_monthly_reset: Date;
    monthly_history: Array<{
        month: string;
        input_tokens: number;
        output_tokens: number;
        conversations: number;
        messages: number;
        bots_created: number;
        bots_deleted: number;
    }>;
    counted_chats: Array<{
        chat_id: string;
        last_input_tokens: number;
        last_output_tokens: number;
    }>;
}
export declare const DashboardStatsSchema: import("mongoose").Schema<DashboardStats, import("mongoose").Model<DashboardStats, any, any, any, Document<unknown, any, DashboardStats, any> & DashboardStats & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DashboardStats, Document<unknown, {}, import("mongoose").FlatRecord<DashboardStats>, {}> & import("mongoose").FlatRecord<DashboardStats> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
