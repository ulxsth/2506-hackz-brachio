import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { ProgrammingLanguage, TranslatedLanguage, CsvRow } from './types';

/**
 * CSV処理エンジン
 * 入力CSVの読み込みと出力CSVの書き込みを担当
 */
export class CsvProcessor {
  private inputPath: string;
  private outputDir: string;

  constructor(inputPath: string, outputDir: string) {
    this.inputPath = inputPath;
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  /**
   * 入力CSVファイルを読み込み、ProgrammingLanguage配列を返す
   */
  async readInputCsv(): Promise<ProgrammingLanguage[]> {
    return new Promise((resolve, reject) => {
      const languages: ProgrammingLanguage[] = [];
      const errors: string[] = [];

      console.log(`📄 CSVファイルを読み込み中: ${this.inputPath}`);

      if (!fs.existsSync(this.inputPath)) {
        reject(new Error(`入力ファイルが見つかりません: ${this.inputPath}`));
        return;
      }

      fs.createReadStream(this.inputPath)
        .pipe(csv())
        .on('data', (row: CsvRow) => {
          try {
            const language = this.parseRow(row);
            if (language) {
              languages.push(language);
            }
          } catch (error) {
            const errorMsg = `行解析エラー: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            console.warn(`⚠️  ${errorMsg}`, row);
          }
        })
        .on('end', () => {
          console.log(`✅ CSV読み込み完了: ${languages.length}件の言語データ`);
          if (errors.length > 0) {
            console.warn(`⚠️  ${errors.length}件の解析エラーがありました`);
          }
          resolve(languages);
        })
        .on('error', (error: any) => {
          console.error('❌ CSV読み込みエラー:', error);
          reject(error);
        });
    });
  }

  /**
   * 翻訳結果を出力CSVファイルに書き込み
   */
  async writeOutputCsv(
    translatedLanguages: TranslatedLanguage[], 
    filename: string
  ): Promise<string> {
    const outputPath = path.join(this.outputDir, filename);
    
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'name', title: 'name' },
        { id: 'wikipediaTitle', title: 'wikipediaTitle' },
        { id: 'summary', title: 'summary' },
        { id: 'japaneseSummary', title: 'japaneseSummary' },
        { id: 'difficulty', title: 'difficulty' },
        { id: 'categories', title: 'categories' },
        { id: 'year', title: 'year' }
      ],
      encoding: 'utf8'
    });

    try {
      console.log(`💾 出力CSVファイルを書き込み中: ${outputPath}`);
      await csvWriter.writeRecords(translatedLanguages);
      console.log(`✅ 出力完了: ${translatedLanguages.length}件のデータを保存`);
      return outputPath;
    } catch (error) {
      console.error('❌ CSV書き込みエラー:', error);
      throw error;
    }
  }

  /**
   * CSV行をProgrammingLanguageオブジェクトにパース
   */
  private parseRow(row: CsvRow): ProgrammingLanguage | null {
    // 必須フィールドの検証
    if (!row.name || !row.summary) {
      console.warn(`⚠️  必須フィールドが不足: name="${row.name}", summary="${row.summary}"`);
      return null;
    }

    // 空の説明文をスキップ
    if (row.summary.trim().length === 0) {
      console.warn(`⚠️  空の説明文をスキップ: ${row.name}`);
      return null;
    }

    // 年数の解析
    let year: number | null = null;
    if (row.year && row.year.trim() !== '') {
      const parsedYear = parseInt(row.year);
      if (!isNaN(parsedYear) && parsedYear > 1950 && parsedYear <= new Date().getFullYear()) {
        year = parsedYear;
      }
    }

    return {
      name: row.name.trim(),
      wikipediaTitle: row.wikipediaTitle ? row.wikipediaTitle.trim() : row.name.trim(),
      summary: row.summary.trim(),
      categories: row.categories ? row.categories.trim() : '',
      year
    };
  }

  /**
   * 出力ディレクトリの確保
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 出力ディレクトリを作成: ${this.outputDir}`);
    }
  }

  /**
   * データの基本統計を表示
   */
  displayDataStats(languages: ProgrammingLanguage[]): void {
    console.log('\n📊 データ統計:');
    console.log(`- 総言語数: ${languages.length}`);
    
    const withYear = languages.filter(lang => lang.year !== null).length;
    console.log(`- 年数情報あり: ${withYear} (${(withYear/languages.length*100).toFixed(1)}%)`);
    
    const withCategories = languages.filter(lang => lang.categories.length > 0).length;
    console.log(`- カテゴリ情報あり: ${withCategories} (${(withCategories/languages.length*100).toFixed(1)}%)`);
    
    const avgSummaryLength = languages.reduce((sum, lang) => sum + lang.summary.length, 0) / languages.length;
    console.log(`- 平均説明文長: ${avgSummaryLength.toFixed(1)}文字`);
    
    // 最も長い説明文の言語
    const longestSummary = languages.reduce((max, lang) => 
      lang.summary.length > max.summary.length ? lang : max
    );
    console.log(`- 最長説明文: ${longestSummary.name} (${longestSummary.summary.length}文字)`);
    
    // 年代別分布
    const decades: { [key: string]: number } = {};
    languages.filter(lang => lang.year).forEach(lang => {
      const decade = Math.floor(lang.year! / 10) * 10;
      decades[`${decade}s`] = (decades[`${decade}s`] || 0) + 1;
    });
    
    if (Object.keys(decades).length > 0) {
      console.log('- 年代別分布:');
      Object.entries(decades)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([decade, count]) => {
          console.log(`  ${decade}: ${count}言語`);
        });
    }
    
    console.log('');
  }

  /**
   * 問題のあるデータの検出とレポート
   */
  validateData(languages: ProgrammingLanguage[]): {
    valid: ProgrammingLanguage[];
    invalid: Array<{ language: ProgrammingLanguage; issues: string[] }>;
  } {
    const valid: ProgrammingLanguage[] = [];
    const invalid: Array<{ language: ProgrammingLanguage; issues: string[] }> = [];

    languages.forEach(language => {
      const issues: string[] = [];

      // 説明文の長さチェック
      if (language.summary.length < 10) {
        issues.push('説明文が短すぎます');
      }
      if (language.summary.length > 1000) {
        issues.push('説明文が長すぎます');
      }

      // 不正な文字の検出
      if (language.summary.includes('�')) {
        issues.push('文字化けが含まれています');
      }

      // HTMLタグの検出
      if (/<[^>]*>/.test(language.summary)) {
        issues.push('HTMLタグが含まれています');
      }

      if (issues.length > 0) {
        invalid.push({ language, issues });
      } else {
        valid.push(language);
      }
    });

    if (invalid.length > 0) {
      console.log(`⚠️  ${invalid.length}件の問題のあるデータを検出:`);
      invalid.slice(0, 5).forEach(({ language, issues }) => {
        console.log(`- ${language.name}: ${issues.join(', ')}`);
      });
      if (invalid.length > 5) {
        console.log(`  ... 他${invalid.length - 5}件`);
      }
    }

    return { valid, invalid };
  }
}
