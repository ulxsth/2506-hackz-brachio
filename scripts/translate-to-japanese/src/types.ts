/**
 * プログラミング言語の基本データ構造
 */
export interface ProgrammingLanguage {
  name: string;
  wikipediaTitle: string;
  summary: string;
  categories: string;
  year: number | null;
}

/**
 * 日本語要約が追加されたプログラミング言語データ
 */
export interface TranslatedLanguage extends ProgrammingLanguage {
  japaneseSummary: string;
}

/**
 * バッチ処理の結果
 */
export interface BatchResult {
  processed: number;
  successful: number;
  failed: number;
  warnings: TranslationWarning[];
  errors: TranslationError[];
  startTime: Date;
  endTime: Date;
  duration: number; // ミリ秒
}

/**
 * 翻訳エラーの詳細
 */
export interface TranslationError {
  name: string;
  summary: string;
  error: string;
  timestamp: string;
  retryCount: number;
}

/**
 * 処理統計情報
 */
export interface ProcessingStats {
  totalLanguages: number;
  processedLanguages: number;
  successfulTranslations: number;
  failedTranslations: number;
  warningsCount: number;
  lengthExceededCount: number;
  successRate: number;
  averageResponseTime: number;
  totalProcessingTime: number;
  startTime: string;
  endTime: string;
  errors: TranslationError[];
  warnings: TranslationWarning[];
}

/**
 * Gemini API のレスポンス型
 */
export interface GeminiResponse {
  text: string;
  candidates?: any[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * 設定オプション
 */
export interface TranslationConfig {
  apiKey: string;
  inputCsvPath: string;
  outputDir: string;
  outputCsvFilename: string;
  outputStatsFilename: string;
  outputErrorsFilename: string;
  batchSize: number;
  rateLimitDelay: number;
  maxRetries: number;
  testMode: boolean;
  testLimit: number;
}

/**
 * CSV行データの型
 */
export interface CsvRow {
  name: string;
  wikipediaTitle: string;
  summary: string;
  categories: string;
  year: string;
}

/**
 * プログレス情報
 */
export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  eta: number; // 推定残り時間（秒）
  processingTime: number; // 経過時間（秒）
}

/**
 * 翻訳警告の詳細 (文字数超過など)
 */
export interface TranslationWarning {
  name: string;
  warningType: 'LENGTH_EXCEEDED' | 'QUALITY_ISSUE' | 'OTHER';
  originalText: string;
  adjustedText: string;
  originalLength: number;
  adjustedLength: number;
  timestamp: string;
}
