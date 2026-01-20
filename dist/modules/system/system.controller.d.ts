import { SystemService } from "./system.service";
export declare class SystemController {
    private readonly systemService;
    constructor(systemService: SystemService);
    verifyDocuments(key: string): Promise<{
        status: string;
    }>;
}
