"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessor = void 0;
const cli_progress_1 = __importDefault(require("cli-progress"));
class BatchProcessor {
    geminiClient;
    batchSize;
    progressBar;
    constructor(geminiClient, batchSize = 25) {
        this.geminiClient = geminiClient;
        this.batchSize = batchSize;
        this.progressBar = new cli_progress_1.default.SingleBar({
            format: '🔄 翻訳進行中 |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s | 経過: {duration}s',
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true
        });
    }
    async processAll(languages) {
        console.log(`🚀 バッチ処理開始: ${languages.length}件の言語を${this.batchSize}件ずつ処理`);
        const startTime = new Date();
        const results = [];
        const errors = [];
        let processedCount = 0;
        let successCount = 0;
        this.progressBar.start(languages.length, 0);
        const batches = this.createBatches(languages);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchNumber = i + 1;
            console.log(`\n📦 バッチ ${batchNumber}/${batches.length} 処理中 (${batch.length}件)`);
            try {
                const batchResults = await this.processBatch(batch, batchNumber);
                batchResults.forEach(result => {
                    processedCount++;
                    if (result.error) {
                        errors.push({
                            name: result.name,
                            summary: batch.find(lang => lang.name === result.name)?.summary || '',
                            error: result.error,
                            timestamp: new Date().toISOString(),
                            retryCount: 0
                        });
                        const originalLang = batch.find(lang => lang.name === result.name);
                        results.push({
                            ...originalLang,
                            japaneseSummary: '翻訳エラー'
                        });
                    }
                    else {
                        successCount++;
                        const originalLang = batch.find(lang => lang.name === result.name);
                        results.push({
                            ...originalLang,
                            japaneseSummary: result.japaneseSummary
                        });
                    }
                    this.progressBar.update(processedCount);
                });
                if (i < batches.length - 1) {
                    console.log(`⏱️  次のバッチまで1秒待機...`);
                    await this.sleep(1000);
                }
            }
            catch (error) {
                console.error(`❌ バッチ ${batchNumber} でエラー発生:`, error);
                batch.forEach(lang => {
                    processedCount++;
                    errors.push({
                        name: lang.name,
                        summary: lang.summary,
                        error: `バッチエラー: ${error instanceof Error ? error.message : String(error)}`,
                        timestamp: new Date().toISOString(),
                        retryCount: 0
                    });
                    results.push({
                        ...lang,
                        japaneseSummary: 'バッチエラー'
                    });
                });
                this.progressBar.update(processedCount);
            }
        }
        this.progressBar.stop();
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const stats = {
            processed: processedCount,
            successful: successCount,
            failed: errors.length,
            errors,
            startTime,
            endTime,
            duration
        };
        this.displayResults(stats);
        return { results, stats };
    }
    async processBatch(batch, batchNumber) {
        const batchResults = [];
        for (const language of batch) {
            try {
                const japaneseSummary = await this.geminiClient.translateToJapanese(language.name, language.summary);
                batchResults.push({
                    name: language.name,
                    japaneseSummary
                });
            }
            catch (error) {
                console.error(`❌ ${language.name} の翻訳に失敗:`, error);
                batchResults.push({
                    name: language.name,
                    japaneseSummary: '翻訳エラー',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        return batchResults;
    }
    createBatches(languages) {
        const batches = [];
        for (let i = 0; i < languages.length; i += this.batchSize) {
            const batch = languages.slice(i, i + this.batchSize);
            batches.push(batch);
        }
        console.log(`📊 ${batches.length}個のバッチを作成 (バッチサイズ: ${this.batchSize})`);
        return batches;
    }
    displayResults(stats) {
        const successRate = (stats.successful / stats.processed * 100).toFixed(1);
        const durationMinutes = (stats.duration / 1000 / 60).toFixed(1);
        console.log('\n🎯 処理結果サマリー:');
        console.log(`- 処理総数: ${stats.processed}件`);
        console.log(`- 成功: ${stats.successful}件`);
        console.log(`- 失敗: ${stats.failed}件`);
        console.log(`- 成功率: ${successRate}%`);
        console.log(`- 処理時間: ${durationMinutes}分`);
        if (stats.errors.length > 0) {
            console.log('\n❌ エラー詳細:');
            stats.errors.slice(0, 5).forEach(error => {
                console.log(`- ${error.name}: ${error.error}`);
            });
            if (stats.errors.length > 5) {
                console.log(`  ... 他${stats.errors.length - 5}件のエラー`);
            }
        }
        const estimatedCost = this.geminiClient.calculateEstimatedCost(stats.successful);
        console.log(`\n💰 推定コスト: $${estimatedCost.toFixed(6)} (約${(estimatedCost * 150).toFixed(2)}円)`);
    }
    async processTestBatch(languages, limit = 10) {
        console.log(`🧪 テストモード: 最初の${limit}件を処理`);
        const testLanguages = languages.slice(0, limit);
        return await this.processAll(testLanguages);
    }
    async retryFailedItems(originalLanguages, errors) {
        console.log(`🔄 失敗アイテムの再処理: ${errors.length}件`);
        const failedLanguages = errors.map(error => originalLanguages.find(lang => lang.name === error.name)).filter(lang => lang !== undefined);
        return await this.processAll(failedLanguages);
    }
    getProgressInfo(current, total, startTime) {
        const now = new Date();
        const processingTime = (now.getTime() - startTime.getTime()) / 1000;
        const percentage = (current / total) * 100;
        const eta = current > 0 ? (processingTime / current) * (total - current) : 0;
        return {
            current,
            total,
            percentage,
            eta,
            processingTime
        };
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.BatchProcessor = BatchProcessor;
//# sourceMappingURL=batch-processor.js.map