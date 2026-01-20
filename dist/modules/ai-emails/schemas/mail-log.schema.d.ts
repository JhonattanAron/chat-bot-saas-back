import { Document } from "mongoose";
export declare class MailLog extends Document {
    messageId: string;
    to: string;
    subject: string;
    type: string;
    userId?: string;
    entityId?: string;
    status: string;
    batch: string;
}
export declare const MailLogSchema: import("mongoose").Schema<MailLog, import("mongoose").Model<MailLog, any, any, any, Document<unknown, any, MailLog, any> & MailLog & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MailLog, Document<unknown, {}, import("mongoose").FlatRecord<MailLog>, {}> & import("mongoose").FlatRecord<MailLog> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
