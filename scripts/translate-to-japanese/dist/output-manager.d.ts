import { TranslatedLanguage, BatchResult, TranslationError } from './types.js';
export declare class OutputManager {
    private outputDir;
    constructor(outputDir: string);
    saveStats(results: TranslatedLanguage[], batchResult: BatchResult, filename: string): Promise<string>;
    saveErrorLog(errors: TranslationError[], filename: string): Promise<string>;
    generateReport(results: TranslatedLanguage[], batchResult: BatchResult, outputFiles: {
        csvPath: string;
        statsPath: string;
        errorLogPath: string;
    }): Promise<string>;
    displaySuccessfulSamples(results: TranslatedLanguage[], count?: number): void;
    private displayStats;
    private generateLengthAnalysis;
    private generateQualitySamples;
    private generateErrorAnalysis;
    private generateRecommendations;
    private categorizeErrors;
    private ensureOutputDirectory;
}
//# sourceMappingURL=output-manager.d.ts.map