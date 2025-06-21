"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationApp = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path = __importStar(require("path"));
const csv_processor_1 = require("./csv-processor");
const gemini_client_1 = require("./gemini-client");
const sequential_processor_1 = require("./sequential-processor");
const output_manager_1 = require("./output-manager");
dotenv_1.default.config();
class TranslationApp {
    config;
    csvProcessor;
    geminiClient;
    sequentialProcessor;
    outputManager;
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
        this.initializeComponents();
    }
    async run() {
        try {
            console.log('🚀 日本語翻訳システム開始');
            console.log(`📋 設定: ${this.config.testMode ? 'テストモード' : '本番モード'}`);
            console.log('\n📂 Step 1: データ読み込み');
            const languages = await this.csvProcessor.readInputCsv();
            if (languages.length === 0) {
                throw new Error('処理対象のデータがありません');
            }
            this.csvProcessor.displayDataStats(languages);
            const { valid, invalid } = this.csvProcessor.validateData(languages);
            if (invalid.length > 0) {
                console.log(`⚠️  ${invalid.length}件の問題のあるデータを除外`);
            }
            const targetLanguages = this.config.testMode
                ? valid.slice(0, this.config.testLimit)
                : valid;
            console.log(`🎯 処理対象: ${targetLanguages.length}件`);
            console.log('\n🔄 Step 2: 翻訳処理');
            const { results, stats } = this.config.testMode
                ? await this.sequentialProcessor.processAll(targetLanguages.slice(0, this.config.testLimit))
                : await this.sequentialProcessor.processAll(targetLanguages);
            console.log('\n💾 Step 3: 結果保存');
            const csvPath = await this.csvProcessor.writeOutputCsv(results, this.config.outputCsvFilename);
            const statsPath = await this.outputManager.saveStats(results, stats, this.config.outputStatsFilename);
            const errorLogPath = await this.outputManager.saveErrorLog(stats.errors, this.config.outputErrorsFilename);
            const reportPath = await this.outputManager.generateReport(results, stats, { csvPath, statsPath, errorLogPath });
            console.log('\n🎉 処理完了サマリー');
            this.displayFinalSummary(results, stats, {
                csvPath, statsPath, errorLogPath, reportPath
            });
            this.outputManager.displaySuccessfulSamples(results, 10);
        }
        catch (error) {
            console.error('❌ 処理中にエラーが発生しました:', error);
            process.exit(1);
        }
    }
    loadConfig() {
        return {
            apiKey: process.env.GEMINI_API_KEY || '',
            inputCsvPath: process.env.INPUT_CSV_PATH || '../scrape-programming-languages/output/programming-languages.csv',
            outputDir: process.env.OUTPUT_DIR || './output',
            outputCsvFilename: process.env.OUTPUT_CSV_FILENAME || 'programming-languages-ja.csv',
            outputStatsFilename: process.env.OUTPUT_STATS_FILENAME || 'translation-stats.json',
            outputErrorsFilename: process.env.OUTPUT_ERRORS_FILENAME || 'errors.log',
            batchSize: parseInt(process.env.BATCH_SIZE || '25'),
            rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY || '1000'),
            maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
            testMode: process.env.TEST_MODE === 'true' || process.argv.includes('--test'),
            testLimit: parseInt(process.env.TEST_LIMIT || '10')
        };
    }
    validateConfig() {
        if (!this.config.apiKey) {
            throw new Error('GEMINI_API_KEY が設定されていません');
        }
        if (!path.isAbsolute(this.config.inputCsvPath)) {
            this.config.inputCsvPath = path.resolve(__dirname, '..', this.config.inputCsvPath);
        }
        if (!path.isAbsolute(this.config.outputDir)) {
            this.config.outputDir = path.resolve(__dirname, '..', this.config.outputDir);
        }
        console.log('🔧 設定検証完了:');
        console.log(`- 入力ファイル: ${this.config.inputCsvPath}`);
        console.log(`- 出力ディレクトリ: ${this.config.outputDir}`);
        console.log(`- バッチサイズ: ${this.config.batchSize}`);
        console.log(`- レート制限: ${this.config.rateLimitDelay}ms`);
        console.log(`- 最大リトライ: ${this.config.maxRetries}回`);
    }
    initializeComponents() {
        this.csvProcessor = new csv_processor_1.CsvProcessor(this.config.inputCsvPath, this.config.outputDir);
        this.geminiClient = new gemini_client_1.GeminiClient(this.config.apiKey, this.config.rateLimitDelay, this.config.maxRetries);
        this.sequentialProcessor = new sequential_processor_1.SequentialProcessor(this.geminiClient, this.config.rateLimitDelay);
        this.outputManager = new output_manager_1.OutputManager(this.config.outputDir);
    }
    displayFinalSummary(results, stats, outputPaths) {
        const successRate = (stats.successful / stats.processed * 100).toFixed(1);
        const durationMinutes = (stats.duration / 1000 / 60).toFixed(1);
        const estimatedCost = this.geminiClient.calculateEstimatedCost(stats.successful);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 最終結果');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ 成功: ${stats.successful}/${stats.processed}件 (${successRate}%)`);
        console.log(`⏱️  処理時間: ${durationMinutes}分`);
        console.log(`💰 推定コスト: $${estimatedCost.toFixed(6)} (約${(estimatedCost * 150).toFixed(2)}円)`);
        console.log('');
        console.log('📁 生成ファイル:');
        console.log(`- 翻訳結果: ${path.basename(outputPaths.csvPath)}`);
        console.log(`- 統計情報: ${path.basename(outputPaths.statsPath)}`);
        if (outputPaths.errorLogPath) {
            console.log(`- エラーログ: ${path.basename(outputPaths.errorLogPath)}`);
        }
        console.log(`- 実行レポート: ${path.basename(outputPaths.reportPath)}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}
exports.TranslationApp = TranslationApp;
async function main() {
    try {
        const app = new TranslationApp();
        await app.run();
    }
    catch (error) {
        console.error('🚨 アプリケーション実行エラー:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map