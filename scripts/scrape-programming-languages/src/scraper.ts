import { WikipediaClient } from './wikipedia-client.js';
import { HTMLParser } from './parser.js';
import { TextProcessor } from './text-processor.js';
import {
  ProgrammingLanguage,
  LanguageEntry,
  ScrapingResult,
  ScrapingMetadata,
  ScraperOptions,
  ProgressInfo,
  ScrapingError
} from './types.js';

/**
 * プログラミング言語スクレイパーのメインクラス
 */
export class ProgrammingLanguageScraper {
  private wikipediaClient: WikipediaClient;
  private parser: HTMLParser;
  private textProcessor: TextProcessor;
  private errors: ScrapingError[] = [];

  constructor(private options: ScraperOptions = {}) {
    this.wikipediaClient = new WikipediaClient();
    this.parser = new HTMLParser();
    this.textProcessor = new TextProcessor();
  }

  /**
   * プログラミング言語リストをスクレイピング
   */
  async scrapeLanguagesList(): Promise<ScrapingResult> {
    const startTime = Date.now();
    console.log('🚀 プログラミング言語のスクレイピングを開始します...');

    try {
      // 1. メインページ取得
      console.log('📄 List of programming languages ページを取得中...');
      const listPageHtml = await this.fetchListPage();
      
      // 2. 言語リスト抽出
      console.log('🔍 プログラミング言語リストを抽出中...');
      const languageEntries = this.parser.extractLanguageLinks(listPageHtml);
      console.log(`✅ ${languageEntries.length} 個の言語を発見しました`);

      // 制限がある場合は適用
      const entriesToProcess = this.options.limit 
        ? languageEntries.slice(0, this.options.limit)
        : languageEntries;

      // 3. 各言語の詳細情報取得
      console.log('📚 各言語の詳細情報を取得中...');
      const languages = await this.fetchLanguageDetails(entriesToProcess);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // 結果のメタデータ作成
      const metadata: ScrapingMetadata = {
        scrapedAt: new Date().toISOString(),
        totalLanguages: languageEntries.length,
        successfullyScraped: languages.length,
        failed: this.errors.length,
        sourceUrl: 'https://en.wikipedia.org/wiki/List_of_programming_languages',
        duration
      };

      console.log('✨ スクレイピング完了！');
      console.log(`📊 成功: ${languages.length}, 失敗: ${this.errors.length}, 所要時間: ${duration.toFixed(2)}秒`);

      return {
        languages,
        metadata
      };

    } catch (error) {
      console.error('❌ スクレイピング中にエラーが発生しました:', error);
      throw error;
    }
  }

  /**
   * メインページのHTMLを取得
   */
  private async fetchListPage(): Promise<string> {
    return await this.wikipediaClient.fetchWithRetry(
      () => this.wikipediaClient.getListPageHtml('List of programming languages'),
      this.options.retryAttempts || 3
    );
  }

  /**
   * 各言語の詳細情報を並行取得
   */
  private async fetchLanguageDetails(entries: LanguageEntry[]): Promise<ProgrammingLanguage[]> {
    const languages: ProgrammingLanguage[] = [];
    const total = entries.length;
    let completed = 0;
    let failed = 0;

    // 進捗表示用の情報
    const startTime = Date.now();
    const progressCallback = (current: string) => {
      const progress: ProgressInfo = {
        total,
        completed,
        failed,
        currentLanguage: current,
        percentage: (completed / total) * 100,
        estimatedTimeRemaining: this.calculateETA(startTime, completed, total)
      };
      this.displayProgress(progress);
    };

    for (const [index, entry] of entries.entries()) {
      try {
        progressCallback(entry.name);
        
        const details = await this.fetchSingleLanguageDetails(entry);
        
        // テキストの品質をチェック
        const quality = this.textProcessor.calculateTextQuality(details.summary);
        if (quality >= 30) { // 最低品質スコア
          languages.push(details);
        } else {
          console.warn(`⚠️  ${entry.name}: 低品質のため除外 (score: ${quality})`);
        }

        completed++;

        // レート制限対応
        const delay = this.options.requestDelay || 1000;
        await this.wikipediaClient.waitForRateLimit(delay);

      } catch (error) {
        failed++;
        const errorInfo: ScrapingError = {
          languageName: entry.name,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        };
        this.errors.push(errorInfo);
        
        console.warn(`⚠️  ${entry.name} の取得に失敗:`, (error as Error).message);
      }
    }

    return languages;
  }

  /**
   * 単一言語の詳細情報を取得
   */
  private async fetchSingleLanguageDetails(entry: LanguageEntry): Promise<ProgrammingLanguage> {
    const summary = await this.wikipediaClient.getPageSummary(entry.wikipediaTitle);
    const processedSummary = this.textProcessor.extractFirst3Sentences(summary.extract);
    const normalizedName = this.textProcessor.normalizeLanguageName(entry.name);
    
    return {
      name: normalizedName,
      wikipediaTitle: entry.wikipediaTitle,
      summary: processedSummary,
      categories: this.parser.extractCategories(entry),
      year: this.parser.extractYear(summary.extract)
    };
  }

  /**
   * 進捗表示
   */
  private displayProgress(progress: ProgressInfo): void {
    const bar = this.createProgressBar(progress.percentage);
    const eta = progress.estimatedTimeRemaining 
      ? `ETA: ${Math.ceil(progress.estimatedTimeRemaining)}s`
      : '';
    
    process.stdout.write(
      `\r🔄 ${bar} ${progress.percentage.toFixed(1)}% ` +
      `(${progress.completed}/${progress.total}) ${eta} - ${progress.currentLanguage || ''}`
    );
    
    if (progress.completed === progress.total) {
      console.log(); // 最後に改行
    }
  }

  /**
   * プログレスバーを作成
   */
  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * 完了予想時間を計算
   */
  private calculateETA(startTime: number, completed: number, total: number): number | undefined {
    if (completed === 0) return undefined;
    
    const elapsed = (Date.now() - startTime) / 1000;
    const avgTimePerItem = elapsed / completed;
    const remaining = total - completed;
    
    return remaining * avgTimePerItem;
  }

  /**
   * エラー情報を取得
   */
  getErrors(): ScrapingError[] {
    return [...this.errors];
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): { [key: string]: number } {
    return {
      totalErrors: this.errors.length,
      networkErrors: this.errors.filter(e => e.error.includes('fetch')).length,
      notFoundErrors: this.errors.filter(e => e.error.includes('not found')).length,
      parseErrors: this.errors.filter(e => e.error.includes('parse')).length,
    };
  }
}
