import cliProgress from 'cli-progress';
import { 
  ProgrammingLanguage, 
  TranslatedLanguage, 
  BatchResult, 
  TranslationError,
  TranslationWarning 
} from './types';
import { GeminiClient } from './gemini-client';

/**
 * 同期・逐次処理エンジン
 * レート制限回避のためのシンプルな1件ずつ処理を担当
 */
export class SequentialProcessor {
  private geminiClient: GeminiClient;
  private rateLimitDelay: number;
  private progressBar: cliProgress.SingleBar;

  constructor(geminiClient: GeminiClient, rateLimitDelay: number = 5000) {
    this.geminiClient = geminiClient;
    this.rateLimitDelay = rateLimitDelay;
    
    // プログレスバーの設定
    this.progressBar = new cliProgress.SingleBar({
      format: '🔄 翻訳進行中 |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s | 経過: {duration}s',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });
  }

  /**
   * 全言語データの同期・逐次翻訳処理
   */
  async processAll(languages: ProgrammingLanguage[]): Promise<{
    results: TranslatedLanguage[];
    stats: BatchResult;
  }> {
    console.log(`🚀 同期処理開始: ${languages.length}件の言語を1件ずつ${this.rateLimitDelay/1000}秒間隔で処理`);
    
    const startTime = new Date();
    const results: TranslatedLanguage[] = [];
    const errors: TranslationError[] = [];
    const warnings: TranslationWarning[] = [];
    let processedCount = 0;
    let successCount = 0;

    // プログレスバー開始
    this.progressBar.start(languages.length, 0);

    // 1件ずつ同期処理
    for (let i = 0; i < languages.length; i++) {
      const language = languages[i];
      
      try {
        console.log(`\n🔄 ${i+1}/${languages.length}: ${language.name} を翻訳中...`);
        
        const japaneseSummary = await this.geminiClient.translateToJapanese(
          language.name, 
          language.summary
        );
        
        // 成功の場合
        results.push({
          ...language,
          japaneseSummary
        });
        
        successCount++;
        console.log(`✅ ${language.name}: "${japaneseSummary}"`);
        
      } catch (error) {
        // エラーの場合
        console.error(`❌ ${language.name} 翻訳失敗:`, error);
        
        errors.push({
          name: language.name,
          summary: language.summary,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          retryCount: 0
        });
        
        // エラーでも基本データは保持
        results.push({
          ...language,
          japaneseSummary: '翻訳エラー'
        });
      }
      
      processedCount++;
      this.progressBar.update(processedCount);
      
      // 最後の要素以外は待機
      if (i < languages.length - 1) {
        console.log(`⏱️  次の翻訳まで${this.rateLimitDelay/1000}秒待機...`);
        await this.sleep(this.rateLimitDelay);
      }
    }

    // プログレスバー終了
    this.progressBar.stop();
    
    // GeminiClientから警告を取得
    const clientWarnings = this.geminiClient.getWarnings();
    warnings.push(...clientWarnings);
    
    const endTime = new Date();
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
      duration
    };

    this.displayResults(stats);
    
    return { results, stats };
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
}
