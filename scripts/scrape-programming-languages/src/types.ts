/**
 * プログラミング言語の基本情報
 */
export interface ProgrammingLanguage {
  name: string;           // 言語名（例: "JavaScript"）
  wikipediaTitle: string; // Wikipediaページタイトル
  summary: string;        // 3文程度の要約
  categories?: string[];  // カテゴリ（汎用、関数型等）
  year?: number;         // 登場年
}

/**
 * 言語エントリー（中間データ）
 */
export interface LanguageEntry {
  name: string;
  wikipediaTitle: string;
}

/**
 * Wikipedia API レスポンス型
 */
export interface WikipediaSummary {
  type: string;
  title: string;
  displaytitle: string;
  extract: string;
  extract_html?: string;
  lang: string;
  dir: string;
  timestamp: string;
  description?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

/**
 * スクレイピング結果の出力形式
 */
export interface ScrapingResult {
  languages: ProgrammingLanguage[];
  metadata: ScrapingMetadata;
}

/**
 * スクレイピングのメタデータ
 */
export interface ScrapingMetadata {
  scrapedAt: string;
  totalLanguages: number;
  successfullyScraped: number;
  failed: number;
  sourceUrl: string;
  duration: number; // 秒
}

/**
 * スクレイパーの設定オプション
 */
export interface ScraperOptions {
  maxConcurrency?: number;  // 並行処理数
  requestDelay?: number;    // API呼び出し間隔（ミリ秒）
  retryAttempts?: number;   // リトライ回数
  outputFormat?: 'json' | 'csv' | 'both';
  limit?: number;           // 取得する言語数の上限
  skipExisting?: boolean;   // 既存データをスキップするか
}

/**
 * API呼び出しのエラー情報
 */
export interface ScrapingError {
  languageName: string;
  error: string;
  timestamp: string;
}

/**
 * 進捗情報
 */
export interface ProgressInfo {
  total: number;
  completed: number;
  failed: number;
  currentLanguage?: string;
  percentage: number;
  estimatedTimeRemaining?: number; // 秒
}
