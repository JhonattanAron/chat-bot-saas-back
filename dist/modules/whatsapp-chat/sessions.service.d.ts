export declare class SessionsService {
    private readonly logger;
    private basePath;
    constructor();
    saveSession(userId: string, sessionData: any): void;
    loadSession(userId: string): any;
    removeSession(userId: string): void;
}
