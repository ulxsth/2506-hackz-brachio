import { ProgrammingLanguage, TranslatedLanguage } from './types.js';
export declare class CsvProcessor {
    private inputPath;
    private outputDir;
    constructor(inputPath: string, outputDir: string);
    readInputCsv(): Promise<ProgrammingLanguage[]>;
    writeOutputCsv(translatedLanguages: TranslatedLanguage[], filename: string): Promise<string>;
    private parseRow;
    private ensureOutputDirectory;
    displayDataStats(languages: ProgrammingLanguage[]): void;
    validateData(languages: ProgrammingLanguage[]): {
        valid: ProgrammingLanguage[];
        invalid: Array<{
            language: ProgrammingLanguage;
            issues: string[];
        }>;
    };
}
//# sourceMappingURL=csv-processor.d.ts.map