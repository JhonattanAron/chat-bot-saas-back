import { MailService } from "./mail.service";
import { SendLeadsMailsDto } from "./dto/send-leads-mails.dto";
export declare class MailController {
    private readonly mailService;
    constructor(mailService: MailService);
    sendLeadsEmails(dto: SendLeadsMailsDto): Promise<{
        total: number;
        sent: number;
        failed: number;
        results: {
            empresa: string;
            email: string;
            status: "sent" | "error";
            messageId?: string;
            error?: string;
            userId?: string;
            batch: string | null;
        }[];
    }>;
    getByUserId(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/mail-log.schema").MailLog, {}> & import("./schemas/mail-log.schema").MailLog & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
}
