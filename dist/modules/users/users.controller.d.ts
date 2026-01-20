import { UsersService } from "./users.service";
import { CreateAssistantDto } from "./schemas/create-asistantdto";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createAssistantChat(body: CreateAssistantDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/assistant-chat.schema").AssistantChatDocument, {}> & import("./schemas/assistant-chat.schema").AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getAllAssistantChats(user_id: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/assistant-chat.schema").AssistantChatDocument, {}> & import("./schemas/assistant-chat.schema").AssistantChat & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getAssistantChat(id: string, user_id: string): Promise<{
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
    addFunction(body: {
        user_id: string;
        assistant_id: string;
        function: {
            name: string;
            description?: string;
            type: "api" | "custom";
            api?: {
                url: string;
                method: string;
                headers?: {
                    key: string;
                    value: string;
                }[];
                parameters?: {
                    name: string;
                    type: string;
                    required: boolean;
                    description?: string;
                }[];
                auth?: {
                    type: string;
                    value: string;
                };
            };
            code?: string;
            credentials?: {
                name: string;
                value: string;
                description?: string;
            }[];
        };
    }): Promise<{
        success: boolean;
        message: string;
        function_name: string;
        assistant_id: string;
        total_functions: number;
        function_id: string | undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        function_name?: undefined;
        assistant_id?: undefined;
        total_functions?: undefined;
        function_id?: undefined;
    }>;
    getFunctions(user_id: string, assistant_id: string): Promise<{
        success: boolean;
        assistant_id: string;
        assistant_name: string;
        total_functions: number;
        functions: {
            id: any;
            name: any;
            description: any;
            type: any;
            api: {
                url: any;
                method: any;
                headers: any;
                parameters: any;
                auth: any;
            } | undefined;
            code: any;
            credentials: any;
            hasCode: boolean;
            hasApi: boolean;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        assistant_id?: undefined;
        assistant_name?: undefined;
        total_functions?: undefined;
        functions?: undefined;
    }>;
    updateFunction(functionId: string, body: {
        user_id: string;
        assistant_id: string;
        function: {
            name?: string;
            description?: string;
            type?: "api" | "custom";
            api?: {
                url?: string;
                method?: string;
                headers?: {
                    key: string;
                    value: string;
                }[];
                parameters?: {
                    name: string;
                    type: string;
                    required: boolean;
                    description?: string;
                }[];
                auth?: {
                    type: string;
                    value: string;
                };
            };
            code?: string;
            credentials?: {
                name: string;
                value: string;
                description?: string;
            }[];
        };
    }): Promise<{
        success: boolean;
        message: string;
        function_id: string;
        function_name: string | undefined;
        assistant_id: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        function_id?: undefined;
        function_name?: undefined;
        assistant_id?: undefined;
    }>;
    deleteFunction(functionId: string, user_id: string, assistant_id: string): Promise<{
        success: boolean;
        message: string;
        function_id: string;
        assistant_id: string;
        remaining_functions: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        function_id?: undefined;
        assistant_id?: undefined;
        remaining_functions?: undefined;
    }>;
    createSampleFunctions(body: {
        user_id: string;
    }): Promise<{
        success: boolean;
        message: string;
        assistant_id: string | undefined;
        user_id: string;
        funciones_disponibles: string[];
        next_steps: string[];
        error?: undefined;
        details?: undefined;
    } | {
        success: boolean;
        error: any;
        details: any;
        message?: undefined;
        assistant_id?: undefined;
        user_id?: undefined;
        funciones_disponibles?: undefined;
        next_steps?: undefined;
    }>;
    testEndpoint(body: any): Promise<{
        success: boolean;
        message: string;
        received_body: any;
        timestamp: string;
    }>;
}
