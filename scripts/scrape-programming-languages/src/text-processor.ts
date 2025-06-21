/**
 * テキスト処理ユーティリティ
 */
export class TextProcessor {
  /**
   * テキストから最初の3文を抽出
   */
  extractFirst3Sentences(text: string): string {
    if (!text) return '';

    // HTMLタグの除去
    const cleanText = this.stripHtml(text);
    
    // 文の分割と処理
    const sentences = this.splitIntoSentences(cleanText);
    
    // 有効な文のみを選択（最大3文）
    const validSentences = sentences
      .filter(sentence => this.isValidSentence(sentence))
      .slice(0, 3);

    if (validSentences.length === 0) {
      return this.sanitizeText(cleanText.slice(0, 200)) + '...';
    }

    return validSentences.join(' ');
  }

  /**
   * HTMLタグを除去
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // scriptタグを完全に除去
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // styleタグを完全に除去
      .replace(/<[^>]*>/g, '')                          // その他のHTMLタグを除去
      .replace(/&nbsp;/g, ' ')                          // &nbsp;をスペースに変換
      .replace(/&amp;/g, '&')                           // &amp;を&に変換
      .replace(/&lt;/g, '<')                            // &lt;を<に変換
      .replace(/&gt;/g, '>')                            // &gt;を>に変換
      .replace(/&quot;/g, '"')                          // &quot;を"に変換
      .replace(/&#\d+;/g, '')                          // 数値文字参照を除去
      .replace(/&[a-zA-Z]+;/g, '');                     // その他のHTML実体参照を除去
  }

  /**
   * テキストを文に分割
   */
  private splitIntoSentences(text: string): string[] {
    // より精密な文分割ロジック
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z])/) // 文末記号の後の大文字で分割
      .map(sentence => this.sanitizeText(sentence))
      .filter(sentence => sentence.length > 0);

    return sentences;
  }

  /**
   * 有効な文かどうかを判定
   */
  private isValidSentence(sentence: string): boolean {
    if (!sentence || sentence.length < 10) return false;
    
    // 無効なパターンをチェック
    const invalidPatterns = [
      /^(see also|references?|external links?|further reading)/i,
      /^(this article|this page|this section)/i,
      /^(category|template|file):/i,
      /^\d+\.?\s*$/,                    // 数字のみ
      /^[^a-zA-Z]*$/,                   // アルファベットがない
      /disambiguation/i,
      /redirect/i,
    ];

    if (invalidPatterns.some(pattern => pattern.test(sentence))) {
      return false;
    }

    // 最低限の構造をチェック
    const hasVerb = /\b(is|are|was|were|has|have|can|could|will|would|do|does|did)\b/i.test(sentence);
    const hasSubstantiveContent = sentence.split(/\s+/).length >= 4;

    return hasVerb && hasSubstantiveContent;
  }

  /**
   * テキストをサニタイズ
   */
  sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // 複数の空白を1つに
      .replace(/\n+/g, ' ')           // 改行をスペースに
      .replace(/\t+/g, ' ')           // タブをスペースに
      .replace(/[^\w\s.,!?;:()\-'"]/g, '') // 基本的な文字と記号以外を除去
      .trim();
  }

  /**
   * 要約テキストを生成
   */
  generateSummary(text: string, maxLength: number = 300): string {
    const sentences = this.extractFirst3Sentences(text);
    
    if (sentences.length <= maxLength) {
      return sentences;
    }

    // 長すぎる場合は最初の文だけ使用
    const firstSentence = this.splitIntoSentences(text)[0];
    if (firstSentence && firstSentence.length <= maxLength) {
      return firstSentence;
    }

    // それでも長い場合は切り詰める
    return this.sanitizeText(text.slice(0, maxLength - 3)) + '...';
  }

  /**
   * プログラミング言語名を正規化
   */
  normalizeLanguageName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s+#.\-]/g, '') // プログラミング言語名に必要な文字のみ保持
      .trim();
  }

  /**
   * 年度情報を抽出・検証
   */
  extractAndValidateYear(text: string): number | undefined {
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const matches = text.match(yearPattern);
    
    if (!matches) return undefined;

    const currentYear = new Date().getFullYear();
    const validYears = matches
      .map(year => parseInt(year))
      .filter(year => year >= 1940 && year <= currentYear)
      .sort();

    return validYears.length > 0 ? validYears[0] : undefined;
  }

  /**
   * テキストの品質をスコア化
   */
  calculateTextQuality(text: string): number {
    if (!text) return 0;

    let score = 0;

    // 長さによるスコア (0-30点)
    const length = text.length;
    if (length > 100) score += 30;
    else if (length > 50) score += 20;
    else if (length > 20) score += 10;

    // 文の数によるスコア (0-20点)
    const sentences = this.splitIntoSentences(text);
    if (sentences.length >= 3) score += 20;
    else if (sentences.length >= 2) score += 15;
    else if (sentences.length >= 1) score += 10;

    // 動詞の存在 (0-20点)
    if (/\b(is|are|was|were|has|have|can|will)\b/i.test(text)) {
      score += 20;
    }

    // プログラミング関連用語 (0-20点)
    const programmingTerms = /\b(programming|language|software|computer|code|script|compile|interpret|syntax|algorithm)\b/i;
    if (programmingTerms.test(text)) {
      score += 20;
    }

    // 年度情報 (0-10点)
    if (this.extractAndValidateYear(text)) {
      score += 10;
    }

    return Math.min(score, 100); // 最大100点
  }
}
