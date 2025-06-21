import cliProgress from 'cli-progress';
import { 
  ProgrammingLanguage, 
  TranslatedLanguage, 
  BatchResult, 
  TranslationError, 
  ProgressInfo 
} from './types';
import { GeminiClient } from './gemini-client';

/**
 * バッチ処理エンジン
 * メモリ効率を考慮した分割処理と進捗管理を担当
 */
export class BatchProcessor {
  private geminiClient: GeminiClient;
  private batchSize: number;
  private progressBar: cliProgress.SingleBar;

  constructor(geminiClient: GeminiClient, batchSize: number = 25) {
    this.geminiClient = geminiClient;
    this.batchSize = batchSize;
    
    // プログレスバーの設定
    this.progressBar = new cliProgress.SingleBar({
      format: '🔄 翻訳進行中 |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s | 経過: {duration}s',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });
  }

  /**
   * 全言語データの翻訳処理
   */
  async processAll(languages: ProgrammingLanguage[]): Promise<{
    results: TranslatedLanguage[];
    stats: BatchResult;
  }> {
    console.log(`🚀 バッチ処理開始: ${languages.length}件の言語を${this.batchSize}件ずつ処理`);
    
    const startTime = new Date();
    const results: TranslatedLanguage[] = [];
    const errors: TranslationError[] = [];
    let processedCount = 0;
    let successCount = 0;

    // プログレスバー開始
    this.progressBar.start(languages.length, 0);

    // バッチに分割して処理
    const batches = this.createBatches(languages);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      console.log(`\n📦 バッチ ${batchNumber}/${batches.length} 処理中 (${batch.length}件)`);
      
      try {
        const batchResults = await this.processBatch(batch, batchNumber);
        
        // 結果をマージ
        batchResults.forEach(result => {
          processedCount++;
          
          if (result.error) {
            // エラーの場合
            errors.push({
              name: result.name,
              summary: batch.find(lang => lang.name === result.name)?.summary || '',
              error: result.error,
              timestamp: new Date().toISOString(),
              retryCount: 0
            });
            
            // エラーでも基本データは保持
            const originalLang = batch.find(lang => lang.name === result.name)!;
            results.push({
              ...originalLang,
              japaneseSummary: '翻訳エラー'
            });
          } else {
            // 成功の場合
            successCount++;
            const originalLang = batch.find(lang => lang.name === result.name)!;
            results.push({
              ...originalLang,
              japaneseSummary: result.japaneseSummary
            });
          }
          
          // プログレスバー更新
          this.progressBar.update(processedCount);
        });
        
        // バッチ間の休憩
        if (i < batches.length - 1) {
          console.log(`⏱️  次のバッチまで1秒待機...`);
          await this.sleep(1000);
        }
        
      } catch (error) {
        console.error(`❌ バッチ ${batchNumber} でエラー発生:`, error);
        
        // バッチ全体が失敗した場合の処理
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

    // プログレスバー終了
    this.progressBar.stop();
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // 結果統計の作成
    const stats: BatchResult = {
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

  /**
   * 単一バッチの処理
   */
  private async processBatch(
    batch: ProgrammingLanguage[], 
    batchNumber: number
  ): Promise<Array<{ name: string; japaneseSummary: string; error?: string }>> {
    const batchResults: Array<{ name: string; japaneseSummary: string; error?: string }> = [];
    
    for (const language of batch) {
      try {
        const japaneseSummary = await this.geminiClient.translateToJapanese(
          language.name, 
          language.summary
        );
        
        batchResults.push({
          name: language.name,
          japaneseSummary
        });
        
      } catch (error) {
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

  /**
   * データをバッチに分割
   */
  private createBatches(languages: ProgrammingLanguage[]): ProgrammingLanguage[][] {
    const batches: ProgrammingLanguage[][] = [];
    
    for (let i = 0; i < languages.length; i += this.batchSize) {
      const batch = languages.slice(i, i + this.batchSize);
      batches.push(batch);
    }
    
    console.log(`📊 ${batches.length}個のバッチを作成 (バッチサイズ: ${this.batchSize})`);
    return batches;
  }

  /**
   * 結果統計の表示
   */
  private displayResults(stats: BatchResult): void {
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
    
    // 推定コスト表示
    const estimatedCost = this.geminiClient.calculateEstimatedCost(stats.successful);
    console.log(`\n💰 推定コスト: $${estimatedCost.toFixed(6)} (約${(estimatedCost * 150).toFixed(2)}円)`);
  }

  /**
   * テストモード処理
   */
  async processTestBatch(languages: ProgrammingLanguage[], limit: number = 10): Promise<{
    results: TranslatedLanguage[];
    stats: BatchResult;
  }> {
    console.log(`🧪 テストモード: 最初の${limit}件を処理`);
    
    const testLanguages = languages.slice(0, limit);
    return await this.processAll(testLanguages);
  }

  /**
   * 失敗したアイテムの再処理
   */
  async retryFailedItems(
    originalLanguages: ProgrammingLanguage[],
    errors: TranslationError[]
  ): Promise<{
    results: TranslatedLanguage[];
    stats: BatchResult;
  }> {
    console.log(`🔄 失敗アイテムの再処理: ${errors.length}件`);
    
    const failedLanguages = errors.map(error => 
      originalLanguages.find(lang => lang.name === error.name)
    ).filter(lang => lang !== undefined) as ProgrammingLanguage[];
    
    return await this.processAll(failedLanguages);
  }

  /**
   * 処理進捗の取得
   */
  getProgressInfo(current: number, total: number, startTime: Date): ProgressInfo {
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

  /**
   * 待機関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
