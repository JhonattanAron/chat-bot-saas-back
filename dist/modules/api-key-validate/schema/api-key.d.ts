import { Document, Schema as MongooseSchema } from "mongoose";
export type ApiKeyDocument = ApiKey & Document;
export declare class ApiKey {
    _id?: MongooseSchema.Types.ObjectId;
    key: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    user_id: MongooseSchema.Types.ObjectId;
}
export declare const ApiKeySchema: MongooseSchema<ApiKey, import("mongoose").Model<ApiKey, any, any, any, Document<unknown, any, ApiKey, any> & ApiKey & Required<{
    _id: MongooseSchema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ApiKey, Document<unknown, {}, import("mongoose").FlatRecord<ApiKey>, {}> & import("mongoose").FlatRecord<ApiKey> & Required<{
    _id: MongooseSchema.Types.ObjectId;
}> & {
    __v: number;
}>;
