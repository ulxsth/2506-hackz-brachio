import cliProgress from 'cli-progress';
import { 
  ProgrammingLanguage, 
  TranslatedLanguage, 
  BatchResult, 
  TranslationError,
  TranslationWarning,
  DifficultyError,
  ProcessProgress
} from './types';
import { GeminiClient } from './gemini-client';
import { DifficultyEvaluator } from './difficulty-evaluator';
import { CsvProcessor } from './csv-processor';
import { ProgressManager } from './progress-manager';

/**
 * 同期・逐次処理エンジン
 * レート制限回避のためのシンプルな1件ずつ処理を担当
 */
export class SequentialProcessor {
  private geminiClient: GeminiClient;
  private difficultyEvaluator: DifficultyEvaluator;
  private csvProcessor: CsvProcessor;
  private progressManager: ProgressManager;
  private rateLimitDelay: number;
  private progressBar: cliProgress.SingleBar;
  private difficultyEvaluationEnabled: boolean;
  private batchSize: number;
  private autoSaveInterval: number;

  constructor(
    geminiClient: GeminiClient,
    csvProcessor: CsvProcessor,
    progressManager: ProgressManager,
    rateLimitDelay: number = 5000,
    difficultyEvaluationEnabled: boolean = false,
    batchSize: number = 10,
    autoSaveInterval: number = 10
  ) {
    this.geminiClient = geminiClient;
    this.difficultyEvaluator = new DifficultyEvaluator(geminiClient);
    this.csvProcessor = csvProcessor;
    this.progressManager = progressManager;
    this.rateLimitDelay = rateLimitDelay;
    this.difficultyEvaluationEnabled = difficultyEvaluationEnabled;
    this.batchSize = batchSize;
    this.autoSaveInterval = autoSaveInterval;
    
    // プログレスバーの設定
    this.progressBar = new cliProgress.SingleBar({
      format: '🔄 処理進行中 |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s | 経過: {duration}s',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });
  }

  /**
   * 全言語データの同期・逐次翻訳処理（中断復旧・バッチ処理対応）
   */
  async processAll(languages: ProgrammingLanguage[]): Promise<{
    results: TranslatedLanguage[];
    stats: BatchResult;
  }> {
    console.log(`🚀 最適化処理開始: ${languages.length}件の言語を${this.rateLimitDelay/1000}秒間隔でバッチ処理`);
    console.log(`📦 バッチサイズ: ${this.batchSize}件, 自動保存間隔: ${this.autoSaveInterval}件`);
    
    const startTime = new Date();
    const allResults: TranslatedLanguage[] = [];
    const errors: TranslationError[] = [];
    const warnings: TranslationWarning[] = [];
    let startIndex = 0;
    let processedCount = 0;
    let successCount = 0;
    let currentBatch = 1;

    // 中断復旧チェック
    const savedProgress = await this.progressManager.loadProgress();
    if (savedProgress && await this.progressManager.promptResumeConfirmation(savedProgress)) {
      startIndex = savedProgress.lastProcessedIndex + 1;
      processedCount = savedProgress.processedCount;
      successCount = savedProgress.successCount;
      currentBatch = savedProgress.currentBatch;
      
      console.log(`🔄 処理を ${savedProgress.lastProcessedName} の次から再開します`);
    }

    // プログレスバー開始
    this.progressBar.start(languages.length, processedCount);

    // バッチごとに処理
    for (let batchStart = startIndex; batchStart < languages.length; batchStart += this.batchSize) {
      const batchEnd = Math.min(batchStart + this.batchSize, languages.length);
      const batchLanguages = languages.slice(batchStart, batchEnd);
      const batchResults: TranslatedLanguage[] = [];
      
      console.log(`\n📦 バッチ ${currentBatch} 処理中: ${batchStart + 1}-${batchEnd}/${languages.length}`);
      
      // バッチ内の各言語を処理
      for (let i = 0; i < batchLanguages.length; i++) {
        const globalIndex = batchStart + i;
        const language = batchLanguages[i];
        
        try {
          console.log(`\n🔄 ${globalIndex + 1}/${languages.length}: ${language.name} を翻訳中...`);
          
          const japaneseSummary = await this.geminiClient.translateToJapanese(
            language.name, 
            language.summary
          );
          
          // 認知度評価（有効時のみ）
          let difficulty: number | undefined;
          if (this.difficultyEvaluationEnabled) {
            try {
              console.log(`📊 ${language.name} の認知度を評価中...`);
              difficulty = await this.difficultyEvaluator.evaluateDifficulty(
                language.name,
                language.summary
              );
              console.log(`✅ ${language.name}: 認知度レベル ${difficulty}`);
              
              // 認知度評価後も待機
              if (globalIndex < languages.length - 1) {
                console.log(`⏱️  次の処理まで${this.rateLimitDelay/1000}秒待機...`);
                await this.sleep(this.rateLimitDelay);
              }
            } catch (difficultyError) {
              console.warn(`⚠️  ${language.name} の認知度評価に失敗:`, difficultyError);
              difficulty = undefined;
            }
          }
          
          // 成功の場合
          const translatedLanguage: TranslatedLanguage = {
            ...language,
            japaneseSummary,
            difficulty
          };
          
          batchResults.push(translatedLanguage);
          allResults.push(translatedLanguage);
          successCount++;
          console.log(`✅ ${language.name}: "${japaneseSummary}"`);
          
        } catch (error) {
          // エラーハンドリング
          const translationError: TranslationError = {
            name: language.name,
            summary: language.summary,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            retryCount: 0
          };
          
          errors.push(translationError);
          console.error(`❌ ${language.name} の翻訳に失敗:`, error);
        } finally {
          processedCount++;
          this.progressBar.update(processedCount);
          
          // 進行状況保存
          const progress: ProcessProgress = {
            lastProcessedIndex: globalIndex,
            lastProcessedName: language.name,
            timestamp: new Date().toISOString(),
            totalCount: languages.length,
            processedCount,
            successCount,
            errorCount: errors.length,
            currentBatch
          };
          await this.progressManager.saveProgress(progress);
        }
        
        // レート制限対応の待機
        if (globalIndex < languages.length - 1) {
          console.log(`⏱️  次の処理まで${this.rateLimitDelay/1000}秒待機...`);
          await this.sleep(this.rateLimitDelay);
        }
      }
      
      // バッチ完了時の保存
      if (batchResults.length > 0) {
        await this.saveBatch(batchResults, currentBatch);
        
        // 定期的にメインファイルも更新
        if (currentBatch % Math.ceil(this.autoSaveInterval / this.batchSize) === 0) {
          await this.csvProcessor.writeOutputCsv(allResults, 'programming-languages-ja.csv');
          console.log(`💾 メインファイル更新: ${allResults.length}件保存`);
        }
        
        // メモリクリア
        this.clearBatchMemory(batchResults);
      }
      
      currentBatch++;
    }

    const endTime = new Date();
    this.progressBar.stop();

    // 最終結果保存
    await this.csvProcessor.writeOutputCsv(allResults, 'programming-languages-ja.csv');
    
    // 進行状況クリア
    await this.progressManager.clearProgress();
    const duration = endTime.getTime() - startTime.getTime();

    // 結果統計の作成
    const stats: BatchResult = {
      processed: processedCount,
      successful: successCount,
      failed: errors.length,
      warnings,
      errors,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime()
    };

    this.displayResults(stats);
    
    return { results: allResults, stats };
  }

  /**
   * 結果表示
   */
  private displayResults(stats: BatchResult): void {
    const durationMinutes = Math.round(stats.duration / 60000);
    const successRate = ((stats.successful / stats.processed) * 100).toFixed(1);
    
    console.log(`\n📊 翻訳完了サマリー`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 処理件数: ${stats.processed}件`);
    console.log(`✅ 成功: ${stats.successful}件 (${successRate}%)`);
    console.log(`❌ 失敗: ${stats.failed}件`);
    console.log(`⚠️  警告: ${stats.warnings.length}件`);
    console.log(`📏 文字数超過: ${stats.warnings.filter(w => w.warningType === 'LENGTH_EXCEEDED').length}件`);
    console.log(`⏱️  処理時間: ${durationMinutes}分`);
    console.log(`🎯 平均処理時間: ${(stats.duration / stats.processed / 1000).toFixed(1)}秒/件`);
    
    if (stats.warnings.length > 0) {
      console.log(`\n⚠️  文字数超過が発生した言語:`);
      const lengthWarnings = stats.warnings.filter(w => w.warningType === 'LENGTH_EXCEEDED').slice(0, 5);
      lengthWarnings.forEach(warning => {
        console.log(`   • ${warning.name}: ${warning.originalLength}文字 → ${warning.adjustedLength}文字`);
      });
      
      if (lengthWarnings.length > 5) {
        console.log(`   ... 他${lengthWarnings.length - 5}件の文字数超過`);
      }
    }
    
    if (stats.failed > 0) {
      console.log(`\n❌ エラーが発生した言語:`);
      stats.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error.name}: ${error.error.substring(0, 50)}...`);
      });
      
      if (stats.errors.length > 5) {
        console.log(`   ... 他${stats.errors.length - 5}件のエラー`);
      }
    }
  }

  /**
   * 待機関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 統計情報の取得
   */
  getStats(): any {
    return {
      rateLimitDelay: this.rateLimitDelay,
      processingType: 'sequential',
      expectedRPM: Math.round(60000 / this.rateLimitDelay)
    };
  }

  /**
   * バッチごとの中間結果保存
   */
  private async saveBatch(
    results: TranslatedLanguage[], 
    batchNumber: number
  ): Promise<void> {
    try {
      const batchFilename = `programming-languages-ja-batch-${batchNumber}.csv`;
      await this.csvProcessor.writeOutputCsv(results, batchFilename);
      console.log(`💾 バッチ ${batchNumber} 保存完了: ${results.length}件`);
    } catch (error) {
      console.warn(`⚠️  バッチ ${batchNumber} の保存に失敗:`, error);
    }
  }

  /**
   * メモリ効率化のためのデータクリア
   */
  private clearBatchMemory(results: TranslatedLanguage[]): void {
    // JavaScriptのGCに任せるが、参照を明示的にクリア
    results.length = 0;
    console.log('🗑️  バッチメモリをクリアしました');
  }
}
