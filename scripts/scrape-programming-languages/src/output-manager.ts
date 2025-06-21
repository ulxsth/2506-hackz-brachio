import * as fs from 'fs/promises';
import * as path from 'path';
import { ScrapingResult, ProgrammingLanguage } from './types.js';

/**
 * データ出力管理クラス
 */
export class OutputManager {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
  }

  /**
   * 出力ディレクトリを確保
   */
  async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('出力ディレクトリの作成に失敗:', error);
      throw error;
    }
  }

  /**
   * JSON形式で保存
   */
  async saveAsJson(result: ScrapingResult, filename: string = 'programming-languages.json'): Promise<void> {
    await this.ensureOutputDirectory();
    
    const filePath = path.join(this.outputDir, filename);
    const jsonData = JSON.stringify(result, null, 2);
    
    try {
      await fs.writeFile(filePath, jsonData, 'utf-8');
      console.log(`✅ JSON保存完了: ${filePath}`);
      console.log(`📊 ${result.languages.length} 言語の情報を保存しました`);
    } catch (error) {
      console.error('JSON保存に失敗:', error);
      throw error;
    }
  }

  /**
   * CSV形式で保存
   */
  async saveAsCsv(result: ScrapingResult, filename: string = 'programming-languages.csv'): Promise<void> {
    await this.ensureOutputDirectory();
    
    const filePath = path.join(this.outputDir, filename);
    
    try {
      const csvContent = this.convertToCsv(result.languages);
      await fs.writeFile(filePath, csvContent, 'utf-8');
      console.log(`✅ CSV保存完了: ${filePath}`);
    } catch (error) {
      console.error('CSV保存に失敗:', error);
      throw error;
    }
  }

  /**
   * 両形式で保存
   */
  async saveAsBoth(result: ScrapingResult): Promise<void> {
    await Promise.all([
      this.saveAsJson(result),
      this.saveAsCsv(result)
    ]);
  }

  /**
   * ProgrammingLanguage配列をCSV形式に変換
   */
  private convertToCsv(languages: ProgrammingLanguage[]): string {
    if (languages.length === 0) {
      return 'name,wikipediaTitle,summary,categories,year\n';
    }

    // ヘッダー
    const header = 'name,wikipediaTitle,summary,categories,year\n';
    
    // データ行を作成
    const rows = languages.map(lang => {
      const name = this.escapeCsvField(lang.name);
      const wikipediaTitle = this.escapeCsvField(lang.wikipediaTitle);
      const summary = this.escapeCsvField(lang.summary);
      const categories = this.escapeCsvField(lang.categories?.join(',') || '');
      const year = lang.year || '';
      
      return `${name},${wikipediaTitle},${summary},${categories},${year}`;
    });

    return header + rows.join('\n');
  }

  /**
   * CSVフィールドをエスケープ
   */
  private escapeCsvField(field: string): string {
    if (!field) return '""';
    
    // カンマ、改行、ダブルクォートが含まれている場合はエスケープが必要
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      // ダブルクォートを二重にしてエスケープ
      const escaped = field.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return `"${field}"`;
  }

  /**
   * 統計情報を保存
   */
  async saveStatistics(result: ScrapingResult, errors: any[]): Promise<void> {
    await this.ensureOutputDirectory();
    
    const stats = {
      summary: {
        totalLanguages: result.metadata.totalLanguages,
        successfullyScraped: result.metadata.successfullyScraped,
        failedAttempts: result.metadata.failed,
        successRate: (result.metadata.successfullyScraped / result.metadata.totalLanguages * 100).toFixed(2) + '%',
        duration: result.metadata.duration + ' seconds',
        scrapedAt: result.metadata.scrapedAt
      },
      languagesByYear: this.groupLanguagesByYear(result.languages),
      languagesByCategory: this.groupLanguagesByCategory(result.languages),
      textQualityDistribution: this.analyzeTextQuality(result.languages),
      errors: errors.map(e => ({
        language: e.languageName,
        error: e.error,
        timestamp: e.timestamp
      }))
    };

    const filePath = path.join(this.outputDir, 'statistics.json');
    await fs.writeFile(filePath, JSON.stringify(stats, null, 2), 'utf-8');
    console.log(`📊 統計情報保存完了: ${filePath}`);
  }

  /**
   * 年代別の言語分布を作成
   */
  private groupLanguagesByYear(languages: ProgrammingLanguage[]): { [decade: string]: number } {
    const distribution: { [decade: string]: number } = {};
    
    languages.forEach(lang => {
      if (lang.year) {
        const decade = Math.floor(lang.year / 10) * 10;
        const key = `${decade}s`;
        distribution[key] = (distribution[key] || 0) + 1;
      } else {
        distribution['Unknown'] = (distribution['Unknown'] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * カテゴリ別の言語分布を作成
   */
  private groupLanguagesByCategory(languages: ProgrammingLanguage[]): { [category: string]: number } {
    const distribution: { [category: string]: number } = {};
    
    languages.forEach(lang => {
      if (lang.categories && lang.categories.length > 0) {
        lang.categories.forEach(category => {
          distribution[category] = (distribution[category] || 0) + 1;
        });
      } else {
        distribution['Uncategorized'] = (distribution['Uncategorized'] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * テキスト品質の分析
   */
  private analyzeTextQuality(languages: ProgrammingLanguage[]): { [quality: string]: number } {
    const distribution = {
      'High (200+ chars)': 0,
      'Medium (100-199 chars)': 0,
      'Low (50-99 chars)': 0,
      'Very Low (<50 chars)': 0
    };

    languages.forEach(lang => {
      const length = lang.summary.length;
      if (length >= 200) {
        distribution['High (200+ chars)']++;
      } else if (length >= 100) {
        distribution['Medium (100-199 chars)']++;
      } else if (length >= 50) {
        distribution['Low (50-99 chars)']++;
      } else {
        distribution['Very Low (<50 chars)']++;
      }
    });

    return distribution;
  }

  /**
   * 既存のデータファイルを読み込み
   */
  async loadExistingData(filename: string = 'programming-languages.json'): Promise<ScrapingResult | null> {
    const filePath = path.join(this.outputDir, filename);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as ScrapingResult;
    } catch (error) {
      console.log(`既存データファイルが見つかりません: ${filePath}`);
      return null;
    }
  }

  /**
   * バックアップファイルを作成
   */
  async createBackup(filename: string): Promise<void> {
    const filePath = path.join(this.outputDir, filename);
    const backupPath = path.join(this.outputDir, `${filename}.backup.${Date.now()}`);
    
    try {
      await fs.copyFile(filePath, backupPath);
      console.log(`📋 バックアップ作成: ${backupPath}`);
    } catch (error) {
      // バックアップ作成失敗は致命的ではない
      console.warn(`バックアップ作成に失敗: ${error}`);
    }
  }
}
