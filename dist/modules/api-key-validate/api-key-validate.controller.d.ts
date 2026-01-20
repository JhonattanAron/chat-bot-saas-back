import { ApiKeyValidateService } from "./api-key-validate.service";
export declare class ApiKeyValidateController {
    private readonly apiKeyValidateService;
    constructor(apiKeyValidateService: ApiKeyValidateService);
    createApiKey(body: {
        name: string;
        user_id: string;
    }): Promise<{
        message: string;
        apiKey: {
            id: import("mongoose").Schema.Types.ObjectId | undefined;
            name: string;
            key: string;
        };
    }>;
    updateApiKey(id: string, body: {
        name: string;
    }): Promise<{
        message: string;
        apiKey: {
            id: import("mongoose").Schema.Types.ObjectId | undefined;
            name: string;
        };
    }>;
    deleteApiKey(id: string): Promise<{
        message: string;
    }>;
    getAllApiKeys(): Promise<{
        apiKeys: import("./schema/api-key").ApiKey[];
    }>;
    validateClientKey(body: {
        clientKey: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
