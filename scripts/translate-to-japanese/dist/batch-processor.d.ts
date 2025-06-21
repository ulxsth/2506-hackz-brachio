import { ProgrammingLanguage, TranslatedLanguage, BatchResult, TranslationError, ProgressInfo } from './types.js';
import { GeminiClient } from './gemini-client.js';
export declare class BatchProcessor {
    private geminiClient;
    private batchSize;
    private progressBar;
    constructor(geminiClient: GeminiClient, batchSize?: number);
    processAll(languages: ProgrammingLanguage[]): Promise<{
        results: TranslatedLanguage[];
        stats: BatchResult;
    }>;
    private processBatch;
    private createBatches;
    private displayResults;
    processTestBatch(languages: ProgrammingLanguage[], limit?: number): Promise<{
        results: TranslatedLanguage[];
        stats: BatchResult;
    }>;
    retryFailedItems(originalLanguages: ProgrammingLanguage[], errors: TranslationError[]): Promise<{
        results: TranslatedLanguage[];
        stats: BatchResult;
    }>;
    getProgressInfo(current: number, total: number, startTime: Date): ProgressInfo;
    private sleep;
}
//# sourceMappingURL=batch-processor.d.ts.map