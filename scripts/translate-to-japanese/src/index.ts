import dotenv from 'dotenv';
import * as path from 'path';
import { TranslationConfig } from './types';
import { CsvProcessor } from './csv-processor';
import { GeminiClient } from './gemini-client';
import { SequentialProcessor } from './sequential-processor';
import { OutputManager } from './output-manager';
import { ProgressManager } from './progress-manager';

// 環境変数の読み込み
dotenv.config();

/**
 * メインアプリケーションクラス
 */
class TranslationApp {
  private config: TranslationConfig;
  private csvProcessor!: CsvProcessor;
  private geminiClient!: GeminiClient;
  private sequentialProcessor!: SequentialProcessor;
  private outputManager!: OutputManager;
  private progressManager!: ProgressManager;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
    this.initializeComponents();
  }

  /**
   * メイン実行関数
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 日本語翻訳システム開始');
      console.log(`📋 設定: ${this.config.testMode ? 'テストモード' : '本番モード'}`);
      
      // Step 1: CSVデータの読み込み
      console.log('\n📂 Step 1: データ読み込み');
      const languages = await this.csvProcessor.readInputCsv();
      
      if (languages.length === 0) {
        throw new Error('処理対象のデータがありません');
      }

      // データ統計表示
      this.csvProcessor.displayDataStats(languages);
      
      // データ検証
      const { valid, invalid } = this.csvProcessor.validateData(languages);
      if (invalid.length > 0) {
        console.log(`⚠️  ${invalid.length}件の問題のあるデータを除外`);
      }

      // Step 1.5: 既存データ確認・差分検出（最適化設定時）
      let targetLanguages = valid;
      if (this.config.skipExisting) {
        console.log('\n🔍 Step 1.5: 既存データ確認・差分検出');
        const existingMap = await this.csvProcessor.readExistingOutput();
        targetLanguages = this.csvProcessor.filterUnprocessedLanguages(valid, existingMap);
        
        if (targetLanguages.length === 0) {
          console.log('✅ 全てのデータが既に処理済みです！');
          return;
        }
      }

      // テストモード適用
      if (this.config.testMode) {
        targetLanguages = targetLanguages.slice(0, this.config.testLimit);
        console.log(`🧪 テストモード: ${targetLanguages.length}件に限定`);
      }

      console.log(`🎯 最終処理対象: ${targetLanguages.length}件`);

      // Step 2: 翻訳処理
      console.log('\n🔄 Step 2: 最適化翻訳処理');
      const { results, stats } = await this.sequentialProcessor.processAll(targetLanguages);

      // Step 3: 結果の保存
      console.log('\n💾 Step 3: 結果保存');
      
      // CSV出力
      const csvPath = await this.csvProcessor.writeOutputCsv(
        results, 
        this.config.outputCsvFilename
      );

      // 統計保存
      const statsPath = await this.outputManager.saveStats(
        results, 
        stats, 
        this.config.outputStatsFilename
      );

      // エラーログ保存
      const errorLogPath = await this.outputManager.saveErrorLog(
        stats.errors, 
        this.config.outputErrorsFilename
      );

      // 実行レポート生成
      const reportPath = await this.outputManager.generateReport(
        results, 
        stats, 
        { csvPath, statsPath, errorLogPath }
      );

      // Step 4: 結果サマリー
      console.log('\n🎉 処理完了サマリー');
      this.displayFinalSummary(results, stats, {
        csvPath, statsPath, errorLogPath, reportPath
      });

      // 成功サンプル表示
      this.outputManager.displaySuccessfulSamples(results, 10);

    } catch (error) {
      console.error('❌ 処理中にエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * 設定の読み込み
   */
  private loadConfig(): TranslationConfig {
    return {
      apiKey: process.env.GEMINI_API_KEY || '',
      inputCsvPath: process.env.INPUT_CSV_PATH || '../scrape-programming-languages/output/programming-languages.csv',
      outputDir: process.env.OUTPUT_DIR || './output',
      outputCsvFilename: process.env.OUTPUT_CSV_FILENAME || 'programming-languages-ja.csv',
      outputStatsFilename: process.env.OUTPUT_STATS_FILENAME || 'translation-stats.json',
      outputErrorsFilename: process.env.OUTPUT_ERRORS_FILENAME || 'errors.log',
      batchSize: parseInt(process.env.BATCH_SIZE || '10'),
      rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY || '1000'),
      maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
      testMode: process.env.TEST_MODE === 'true' || process.argv.includes('--test'),
      testLimit: parseInt(process.env.TEST_LIMIT || '10'),
      difficultyEvaluationEnabled: process.env.DIFFICULTY_EVALUATION_ENABLED === 'true',
      // 最適化設定
      skipExisting: process.env.SKIP_EXISTING !== 'false', // デフォルトで有効
      enableResume: process.env.ENABLE_RESUME !== 'false', // デフォルトで有効
      autoSaveInterval: parseInt(process.env.AUTO_SAVE_INTERVAL || '10')
    };
  }

  /**
   * 設定の検証
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('GEMINI_API_KEY が設定されていません');
    }

    // 入力ファイルパスの解決
    if (!path.isAbsolute(this.config.inputCsvPath)) {
      this.config.inputCsvPath = path.resolve(__dirname, '..', this.config.inputCsvPath);
    }

    // 出力ディレクトリパスの解決
    if (!path.isAbsolute(this.config.outputDir)) {
      this.config.outputDir = path.resolve(__dirname, '..', this.config.outputDir);
    }

    console.log('🔧 設定検証完了:');
    console.log(`- 入力ファイル: ${this.config.inputCsvPath}`);
    console.log(`- 出力ディレクトリ: ${this.config.outputDir}`);
    console.log(`- バッチサイズ: ${this.config.batchSize}件`);
    console.log(`- 自動保存間隔: ${this.config.autoSaveInterval}件`);
    console.log(`- レート制限: ${this.config.rateLimitDelay}ms`);
    console.log(`- 認知度評価: ${this.config.difficultyEvaluationEnabled ? '有効' : '無効'}`);
    console.log(`- 既存データスキップ: ${this.config.skipExisting ? '有効' : '無効'}`);
    console.log(`- 中断復旧: ${this.config.enableResume ? '有効' : '無効'}`);
    console.log(`- 最大リトライ: ${this.config.maxRetries}回`);
  }

  /**
   * コンポーネントの初期化
   */
  private initializeComponents(): void {
    this.csvProcessor = new CsvProcessor(this.config.inputCsvPath, this.config.outputDir);
    this.geminiClient = new GeminiClient(
      this.config.apiKey, 
      this.config.rateLimitDelay, 
      this.config.maxRetries
    );
    this.progressManager = new ProgressManager(this.config.outputDir);
    this.sequentialProcessor = new SequentialProcessor(
      this.geminiClient,
      this.csvProcessor,
      this.progressManager,
      this.config.rateLimitDelay,
      this.config.difficultyEvaluationEnabled,
      this.config.batchSize,
      this.config.autoSaveInterval
    );
    this.outputManager = new OutputManager(this.config.outputDir);
  }

  /**
   * 最終サマリーの表示
   */
  private displayFinalSummary(
    results: any[], 
    stats: any, 
    outputPaths: {
      csvPath: string;
      statsPath: string;
      errorLogPath: string;
      reportPath: string;
    }
  ): void {
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

/**
 * アプリケーション実行
 */
async function main(): Promise<void> {
  try {
    const app = new TranslationApp();
    await app.run();
  } catch (error) {
    console.error('🚨 アプリケーション実行エラー:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合にmain関数を実行
if (require.main === module) {
  main();
}

export { TranslationApp };
