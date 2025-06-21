export declare class GeminiClient {
    private genAI;
    private model;
    private rateLimitDelay;
    private maxRetries;
    constructor(apiKey: string, rateLimitDelay?: number, maxRetries?: number);
    translateToJapanese(languageName: string, englishSummary: string): Promise<string>;
    translateBatch(languages: Array<{
        name: string;
        summary: string;
    }>): Promise<Array<{
        name: string;
        japaneseSummary: string;
        error?: string;
    }>>;
    private buildPrompt;
    private cleanResponse;
    private validateResponse;
    private sleep;
    calculateEstimatedCost(requestCount: number): number;
}
//# sourceMappingURL=gemini-client.d.ts.map