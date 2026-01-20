export declare class GoogleService {
    private apiKey;
    private cseId;
    search(query: string, num?: number): Promise<{
        title: string;
        url: string;
        snippet: string;
    }[]>;
}
