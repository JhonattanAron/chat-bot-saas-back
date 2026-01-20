import { Document } from "mongoose";
export type PlainTextExportDocument = PlainTextExport & Document;
export declare class PlainTextExport {
    filename: string;
    batch_id: string;
    content: string;
    analized: boolean;
    analized_data: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PlainTextExportSchema: import("mongoose").Schema<PlainTextExport, import("mongoose").Model<PlainTextExport, any, any, any, Document<unknown, any, PlainTextExport, any> & PlainTextExport & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PlainTextExport, Document<unknown, {}, import("mongoose").FlatRecord<PlainTextExport>, {}> & import("mongoose").FlatRecord<PlainTextExport> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
