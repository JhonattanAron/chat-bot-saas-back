import { Model } from "mongoose";
import { AssistantChatDocument } from "src/modules/users/schemas/assistant-chat.schema";
interface FunctionExecution {
    success: boolean;
    result: any;
    error?: string;
    executedFunction: string;
}
export declare class CustomFunctionService {
    private readonly assistantChatModel;
    private readonly logger;
    constructor(assistantChatModel: Model<AssistantChatDocument>);
    executeFunction(functionName: string, parameters: string[], userId: string, assistantId: string): Promise<FunctionExecution>;
    private executeApiFunction;
    private executeCustomFunction;
    getFunctionsList(userId: string, assistantId: string): Promise<any[]>;
    parseFunctionCall(text: string): {
        functionName: string;
        parameters: string[];
    } | null;
}
export {};
