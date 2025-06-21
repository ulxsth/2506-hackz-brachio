import * as cheerio from 'cheerio';
import { LanguageEntry } from './types.js';

/**
 * HTMLパーサー - Wikipediaページの解析を担当
 */
export class HTMLParser {
  /**
   * プログラミング言語リストページから言語エントリーを抽出
   */
  extractLanguageLinks(html: string): LanguageEntry[] {
    const $ = cheerio.load(html);
    const languageEntries: LanguageEntry[] = [];
    const seenNames = new Set<string>();

    // List of programming languagesページの構造に合わせたセレクタ
    // 複数のパターンに対応
    const selectors = [
      'div.mw-parser-output li a[href^="/wiki/"]',
      'div.mw-parser-output ul li a[href^="/wiki/"]',
      'table tr td a[href^="/wiki/"]',
      '.wikitable tr td a[href^="/wiki/"]'
    ];

    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $link = $(element);
        const name = $link.text().trim();
        const href = $link.attr('href');
        
        if (href && this.isValidLanguageName(name) && !seenNames.has(name)) {
          const wikipediaTitle = href.replace('/wiki/', '').replace(/_/g, ' ');
          
          languageEntries.push({
            name,
            wikipediaTitle
          });
          
          seenNames.add(name);
        }
      });
    });

    return this.sortAndFilterLanguages(languageEntries);
  }

  /**
   * 言語名の妥当性をチェック
   */
  private isValidLanguageName(name: string): boolean {
    if (!name || name.length < 2) return false;
    
    // 除外するパターン
    const excludePatterns = [
      /^(List|Category|Template|File|Talk|User|Wikipedia|Help|Portal):/i,
      /\(disambiguation\)/i,
      /^[0-9]+$/,
      /^[a-z]$/i, // 単一文字
      /^\s*$/,    // 空白のみ
    ];

    // 除外する用語
    const excludeTerms = [
      'List', 'Category', 'Template', 'File', 'Talk', 'User', 'Wikipedia', 
      'Help', 'Portal', 'Main Page', 'Contents', 'Featured content',
      'Current events', 'Random article', 'Donate', 'Contact us',
      'edit', 'source', 'history', 'watch', 'Special'
    ];

    // パターンチェック
    if (excludePatterns.some(pattern => pattern.test(name))) {
      return false;
    }

    // 除外用語チェック
    if (excludeTerms.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
      return false;
    }

    // プログラミング言語らしい名前かをチェック
    return this.looksLikeProgrammingLanguage(name);
  }

  /**
   * プログラミング言語らしい名前かを判定
   */
  private looksLikeProgrammingLanguage(name: string): boolean {
    // 一般的なプログラミング言語の特徴
    const commonPatterns = [
      /^[A-Z]/,           // 大文字で始まる
      /[+#]/,             // C++, C#など
      /script$/i,         // JavaScript, TypeScriptなど
      /\w{2,}/,          // 最低2文字以上
    ];

    // 明らかにプログラミング言語でない用語
    const nonLanguagePatterns = [
      /^(and|or|the|of|in|on|at|to|for|with|by)$/i,
      /^(page|section|article|chapter|introduction|overview)$/i,
      /programming/i,
      /language/i,
      /computer/i,
      /software/i,
      /system/i,
    ];

    if (nonLanguagePatterns.some(pattern => pattern.test(name))) {
      return false;
    }

    return commonPatterns.some(pattern => pattern.test(name));
  }

  /**
   * 言語リストをソートとフィルタリング
   */
  private sortAndFilterLanguages(languages: LanguageEntry[]): LanguageEntry[] {
    // 重複を除去（名前の大文字小文字を無視）
    const uniqueLanguages = new Map<string, LanguageEntry>();
    
    languages.forEach(lang => {
      const key = lang.name.toLowerCase();
      if (!uniqueLanguages.has(key)) {
        uniqueLanguages.set(key, lang);
      }
    });

    // アルファベット順にソート
    return Array.from(uniqueLanguages.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * カテゴリ情報を抽出（将来の拡張用）
   */
  extractCategories(entry: LanguageEntry): string[] {
    // 現在は空配列を返す（将来の拡張で実装）
    return [];
  }

  /**
   * テキストから登場年を抽出
   */
  extractYear(text: string): number | undefined {
    if (!text) return undefined;

    // 年の抽出パターン（より厳密に）
    const yearPatterns = [
      /(?:created|developed|designed|appeared|released|introduced).*?(?:in\s+)?(\b(?:19|20)\d{2}\b)/i,
      /(?:\b(?:19|20)\d{2}\b).*?(?:created|developed|designed|appeared|released|introduced)/i,
      /first\s+(?:appeared|released).*?(\b(?:19|20)\d{2}\b)/i,
      /(\b(?:19|20)\d{2}\b)/g
    ];

    for (const pattern of yearPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const years = matches
          .map(match => {
            const yearMatch = match.match(/\b(19|20)\d{2}\b/);
            return yearMatch ? parseInt(yearMatch[0]) : null;
          })
          .filter((year): year is number => year !== null && year >= 1940 && year <= new Date().getFullYear())
          .sort();

        if (years.length > 0) {
          return years[0]; // 最も古い年を返す
        }
      }
    }

    return undefined;
  }

  /**
   * HTMLから説明テキストを抽出
   */
  extractDescription(html: string): string {
    const $ = cheerio.load(html);
    
    // メインの説明部分を抽出
    const paragraphs = $('p').toArray();
    
    for (const p of paragraphs) {
      const text = $(p).text().trim();
      if (text.length > 50 && !text.includes('disambiguation')) {
        return text;
      }
    }

    return '';
  }
}
