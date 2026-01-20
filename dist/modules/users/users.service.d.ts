import { AssistantChat, AssistantChatDocument } from "./schemas/assistant-chat.schema";
import { Model } from "mongoose";
import { User } from "./schemas/UserSchema";
import { CreateAssistantDto } from "./schemas/create-asistantdto";
import { FaqsService } from "../faqs/faqs.service";
export declare class UsersService {
    private model;
    private userModel;
    private readonly faqsService;
    constructor(model: Model<AssistantChatDocument>, userModel: Model<User>, faqsService: FaqsService);
    createAssistantChatData(body: CreateAssistantDto): Promise<import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    addFunctionToAssistant(assistantId: string, userId: string, newFunction: any): Promise<import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateFunction(assistantId: string, userId: string, functionId: string, updateData: any): Promise<import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteFunction(assistantId: string, userId: string, functionId: string): Promise<import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getAssistantChatByChatIdAndUserIdAndFaqs(id: string, user_id: string): Promise<{
        faqs: {
            _id: any;
            question: any;
            answer: any;
            category: any;
        }[];
        user_id: string;
        name: string;
        description: string;
        funciones: import("./schemas/functions-schema").FunctionItem[];
        status: string;
        type: string;
        use_case: string;
        welcome_message: string;
        createdAt: Date;
        updatedAt: Date;
        all_messages: number;
        last_activiti: string;
        _id: unknown;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    getAllAssistantChatsByUserId(user_id: string): Promise<(import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getAssistantChatByUserId(user_id: string): Promise<(import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    getAssistantById(assistantId: string, userId: string): Promise<(import("mongoose").Document<unknown, {}, AssistantChatDocument, {}> & AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    crearUsuario(usuario: User): Promise<User>;
    obtenerUsuarios(email: string): Promise<User | null>;
    actualizarUsuario(id: string, usuario: User): Promise<User>;
    eliminarUsuario(id: string): Promise<User>;
}
