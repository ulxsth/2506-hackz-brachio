export interface ProgrammingLanguage {
    name: string;
    wikipediaTitle: string;
    summary: string;
    categories: string;
    year: number | null;
}
export interface TranslatedLanguage extends ProgrammingLanguage {
    japaneseSummary: string;
}
export interface BatchResult {
    processed: number;
    successful: number;
    failed: number;
    errors: TranslationError[];
    startTime: Date;
    endTime: Date;
    duration: number;
}
export interface TranslationError {
    name: string;
    summary: string;
    error: string;
    timestamp: string;
    retryCount: number;
}
export interface ProcessingStats {
    totalLanguages: number;
    processedLanguages: number;
    successfulTranslations: number;
    failedTranslations: number;
    successRate: number;
    averageResponseTime: number;
    totalProcessingTime: number;
    startTime: string;
    endTime: string;
    errors: TranslationError[];
}
export interface GeminiResponse {
    text: string;
    candidates?: any[];
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}
export interface TranslationConfig {
    apiKey: string;
    inputCsvPath: string;
    outputDir: string;
    outputCsvFilename: string;
    outputStatsFilename: string;
    outputErrorsFilename: string;
    batchSize: number;
    rateLimitDelay: number;
    maxRetries: number;
    testMode: boolean;
    testLimit: number;
}
export interface CsvRow {
    name: string;
    wikipediaTitle: string;
    summary: string;
    categories: string;
    year: string;
}
export interface ProgressInfo {
    current: number;
    total: number;
    percentage: number;
    eta: number;
    processingTime: number;
}
//# sourceMappingURL=types.d.ts.map