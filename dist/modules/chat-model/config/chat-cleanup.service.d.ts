import { Model } from "mongoose";
import { ChatDocument } from "../schemas/chat.schema";
export declare class ChatCleanupService {
    private chatModel;
    constructor(chatModel: Model<ChatDocument>);
    handleCleanup(): Promise<void>;
}
