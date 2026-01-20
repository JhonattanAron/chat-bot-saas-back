import { Model } from "mongoose";
import { MailLog } from "./schemas/mail-log.schema";
import { ChatService } from "../chat-model/chat/chat.service";
import { MailTemplateService } from "./services/mail-template.service";
export declare class MailService {
    private readonly mailLogModel;
    private readonly chatService;
    private readonly mailTemplateService;
    private readonly resend;
    private readonly logger;
    constructor(mailLogModel: Model<MailLog>, chatService: ChatService, mailTemplateService: MailTemplateService);
    sendEmail(params: {
        to: string;
        subject: string;
        type: string;
        context: any;
        userId: string;
        entityId?: string;
        batch: string;
    }): Promise<{
        error: string;
        data?: undefined;
    } | {
        data: import("resend").CreateEmailResponseSuccess | null;
        error: import("resend").ErrorResponse | null;
    }>;
    findCampaingByUserId(userId: string): Promise<(import("mongoose").Document<unknown, {}, MailLog, {}> & MailLog & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
}
