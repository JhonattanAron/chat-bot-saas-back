export declare class PromptGeneratorService {
    generateUnifiedPrompt(assistantName: string, assistantDescription: string, memoryContext: string, userMessage: string, availableFunctions: any[], functionResults?: any[]): string;
    private formatFunctionsForPrompt;
}
