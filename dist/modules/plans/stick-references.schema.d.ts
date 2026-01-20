import type { Document } from "mongoose";
export type StickReferencesDocument = StickReferences & Document;
export declare class StickReferences {
    user_id: string;
    reference: string;
    is_active: boolean;
    expires_at: Date;
    created_at: Date;
}
export declare const StickReferencesSchema: import("mongoose").Schema<StickReferences, import("mongoose").Model<StickReferences, any, any, any, Document<unknown, any, StickReferences, any> & StickReferences & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StickReferences, Document<unknown, {}, import("mongoose").FlatRecord<StickReferences>, {}> & import("mongoose").FlatRecord<StickReferences> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
