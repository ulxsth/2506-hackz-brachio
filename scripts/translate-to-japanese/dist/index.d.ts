declare class TranslationApp {
    private config;
    private csvProcessor;
    private geminiClient;
    private batchProcessor;
    private outputManager;
    constructor();
    run(): Promise<void>;
    private loadConfig;
    private validateConfig;
    private initializeComponents;
    private displayFinalSummary;
}
export { TranslationApp };
//# sourceMappingURL=index.d.ts.map