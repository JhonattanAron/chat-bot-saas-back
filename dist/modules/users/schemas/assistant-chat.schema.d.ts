import { Document } from "mongoose";
import { FunctionItem } from "./functions-schema";
export type AssistantChatDocument = AssistantChat & Document;
export declare class AssistantChat {
    user_id: string;
    name: string;
    description: string;
    funciones: FunctionItem[];
    status: string;
    type: string;
    use_case: string;
    welcome_message: string;
    createdAt: Date;
    updatedAt: Date;
    all_messages: number;
    last_activiti: string;
}
export declare const AssistantChatSchema: import("mongoose").Schema<AssistantChat, import("mongoose").Model<AssistantChat, any, any, any, Document<unknown, any, AssistantChat, any> & AssistantChat & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AssistantChat, Document<unknown, {}, import("mongoose").FlatRecord<AssistantChat>, {}> & import("mongoose").FlatRecord<AssistantChat> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
