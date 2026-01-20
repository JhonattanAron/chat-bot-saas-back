import { ApiKey, ApiKeyDocument } from "./schema/api-key";
import { Model } from "mongoose";
export declare class ApiKeyValidateService {
    private readonly apiKeyModel;
    constructor(apiKeyModel: Model<ApiKeyDocument>);
    private generateApiKey;
    createApiKey(name: string, user_id: string): Promise<ApiKey>;
    updateApiKey(id: string, name: string): Promise<ApiKey | null>;
    deleteApiKey(id: string): Promise<any>;
    findAllApiKeys(): Promise<ApiKey[]>;
    validateClientKey(clientKey: string): Promise<boolean>;
}
