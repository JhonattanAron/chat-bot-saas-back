import { Document, Schema as MongooseSchema } from "mongoose";
export declare class ApiParameter {
    name: string;
    type: string;
    required: boolean;
    description?: string;
}
export declare class ApiHeader {
    key: string;
    value: string;
}
export declare class ApiAuth {
    type: string;
    value: string;
}
export declare class ApiConfig {
    url: string;
    method: string;
    headers: ApiHeader[];
    parameters: ApiParameter[];
    auth?: ApiAuth;
}
export declare class FunctionCredential {
    name: string;
    value: string;
    description?: string;
}
export declare class FunctionItem {
    _id?: MongooseSchema.Types.ObjectId;
    name: string;
    description?: string;
    type: "api" | "custom";
    api?: ApiConfig;
    code?: string;
    credentials?: FunctionCredential[];
}
export declare const FunctionItemSchema: MongooseSchema<FunctionItem, import("mongoose").Model<FunctionItem, any, any, any, Document<unknown, any, FunctionItem, any> & FunctionItem & Required<{
    _id: MongooseSchema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FunctionItem, Document<unknown, {}, import("mongoose").FlatRecord<FunctionItem>, {}> & import("mongoose").FlatRecord<FunctionItem> & Required<{
    _id: MongooseSchema.Types.ObjectId;
}> & {
    __v: number;
}>;
export type FunctionItemDocument = FunctionItem & Document;
export declare class FunctionSchema {
    user_id: string;
    assistant_id: MongooseSchema.Types.ObjectId;
    functions: FunctionItem[];
}
export type FunctionSchemaDocument = FunctionSchema & Document;
export declare const FunctionSchemaSchema: MongooseSchema<FunctionSchema, import("mongoose").Model<FunctionSchema, any, any, any, Document<unknown, any, FunctionSchema, any> & FunctionSchema & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FunctionSchema, Document<unknown, {}, import("mongoose").FlatRecord<FunctionSchema>, {}> & import("mongoose").FlatRecord<FunctionSchema> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
