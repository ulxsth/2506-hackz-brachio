import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse, TranslationError, TranslationWarning } from './types';

/**
 * Gemini APIクライアント
 * 30文字以内の日本語要約生成に特化
 */
export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private rateLimitDelay: number;
  private maxRetries: number;
  private warnings: TranslationWarning[] = [];

  constructor(apiKey: string, rateLimitDelay: number = 5000, maxRetries: number = 5) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // 最もコスト効率の良いGemini 1.5 Flash-8Bを使用
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b",
      generationConfig: {
        temperature: 0.3, // 一貫性を重視
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 50, // 30文字以内に制限
      }
    });
    this.rateLimitDelay = rateLimitDelay;
    this.maxRetries = maxRetries;
  }

  /**
   * 単一の英語説明文を日本語に翻訳
   */
  async translateToJapanese(
    languageName: string, 
    englishSummary: string
  ): Promise<string> {
    const prompt = this.buildPrompt(languageName, englishSummary);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ${languageName} を翻訳中... (試行 ${attempt}/${this.maxRetries})`);
        
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // 応答の検証と清書
        const cleanedText = this.cleanResponse(text);
        const validatedText = this.validateResponse(cleanedText, languageName);
        
        console.log(`✅ ${languageName}: "${validatedText}"`);
        
        // レート制限対応
        if (attempt < this.maxRetries) {
          await this.sleep(this.rateLimitDelay);
        }
        
        return validatedText;
        
      } catch (error) {
        console.warn(`⚠️  ${languageName} の翻訳に失敗 (試行 ${attempt}/${this.maxRetries}):`, error);
        
        // 429エラー専用処理 + retryDelay対応
        if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
          const errorDetails = (error as any).errorDetails;
          const retryInfo = errorDetails?.find((detail: any) => 
            detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          
          const retryDelaySeconds = retryInfo?.retryDelay?.replace('s', '');
          const waitTime = retryDelaySeconds ? 
            parseInt(retryDelaySeconds) * 1000 : 
            30000; // デフォルト30秒
            
          console.log(`⏰ 429エラー: ${waitTime/1000}秒待機...`);
          await this.sleep(waitTime);
        } else {
          // 通常のエクスポネンシャルバックオフ
          const backoffDelay = this.rateLimitDelay * Math.pow(2, attempt - 1);
          await this.sleep(backoffDelay);
        }
        
        if (attempt === this.maxRetries) {
          throw new Error(`翻訳失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    throw new Error('最大試行回数に達しました');
  }

  /**
   * バッチ処理で複数の言語を一度に翻訳
   */
  async translateBatch(
    languages: Array<{ name: string; summary: string }>
  ): Promise<Array<{ name: string; japaneseSummary: string; error?: string }>> {
    const results: Array<{ name: string; japaneseSummary: string; error?: string }> = [];
    
    for (const language of languages) {
      try {
        const japaneseSummary = await this.translateToJapanese(language.name, language.summary);
        results.push({
          name: language.name,
          japaneseSummary
        });
      } catch (error) {
        console.error(`❌ ${language.name} のバッチ翻訳に失敗:`, error);
        results.push({
          name: language.name,
          japaneseSummary: '翻訳エラー',
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // バッチ内でもレート制限を考慮
      await this.sleep(this.rateLimitDelay);
    }
    
    return results;
  }

  /**
   * プロンプト構築
   */
  private buildPrompt(languageName: string, englishSummary: string): string {
    return `以下のプログラミング言語の英語説明文を、正確で簡潔な日本語に翻訳してください。

プログラミング言語名: "${languageName}"

英語説明文:
"${englishSummary}"

翻訳要件:
- 30文字以内の簡潔な日本語
- プログラミング言語の特徴を正確に表現
- 技術的に正確な用語を使用
- 読みやすく自然な日本語

回答形式:
[翻訳結果のみを出力。説明や補足は不要]

例:
- "Python" → "汎用プログラミング言語。AI分野で人気。"
- "JavaScript" → "Webページに動的機能を追加する言語。"

翻訳結果:`;
  }

  /**
   * レスポンスの清書
   */
  private cleanResponse(text: string): string {
    return text
      .trim()
      .replace(/^["'`]|["'`]$/g, '') // 引用符の除去
      .replace(/\n+/g, ' ') // 改行を空白に
      .replace(/\s+/g, ' ') // 複数空白を単一空白に
      .trim();
  }

  /**
   * レスポンスの検証とスマート削減
   */
  private validateResponse(text: string, languageName: string): string {
    const originalText = text;
    const originalLength = text.length;
    
    // 30文字制限チェック（記録のみ、削減なし）
    if (text.length > 30) {
      console.warn(`⚠️  文字数超過 (${text.length}文字): "${text}"`);
      
      // 警告を記録（削減は行わない）
      this.warnings.push({
        name: languageName,
        warningType: 'LENGTH_EXCEEDED',
        originalText,
        adjustedText: text, // 削減せずそのまま保持
        originalLength,
        adjustedLength: text.length, // 元の長さのまま
        timestamp: new Date().toISOString()
      });
    }

    // 最低限の品質チェック
    if (text.length < 5) {
      throw new Error('翻訳結果が短すぎます');
    }

    // 明らかに不適切な内容の検出
    const invalidPatterns = [
      /翻訳できません/i,
      /error/i,
      /申し訳/i,
      /すみません/i
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(text)) {
        throw new Error('不適切な翻訳結果');
      }
    }

    return text;
  }

  /**
   * プログラミング言語の認知度を評価
   */
  async evaluateDifficulty(
    languageName: string, 
    summary: string
  ): Promise<number> {
    const prompt = this.buildDifficultyPrompt(languageName, summary);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📊 ${languageName} の認知度を評価中... (試行 ${attempt}/${this.maxRetries})`);
        
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // 認知度レベルをパース
        const difficulty = this.parseDifficultyFromResponse(text);
        
        console.log(`✅ ${languageName}: 認知度レベル ${difficulty}`);
        
        // レート制限対応
        if (attempt < this.maxRetries) {
          await this.sleep(this.rateLimitDelay);
        }
        
        return difficulty;
        
      } catch (error) {
        console.warn(`⚠️  ${languageName} の認知度評価に失敗 (試行 ${attempt}/${this.maxRetries}):`, error);
        
        // 429エラー専用処理
        if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
          const errorDetails = (error as any).errorDetails;
          const retryInfo = errorDetails?.find((detail: any) => 
            detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          
          const retryDelaySeconds = retryInfo?.retryDelay?.replace('s', '');
          const waitTime = retryDelaySeconds ? 
            parseInt(retryDelaySeconds) * 1000 : 
            30000; // デフォルト30秒
            
          console.log(`⏰ 429エラー: ${waitTime/1000}秒待機...`);
          await this.sleep(waitTime);
        } else {
          // 通常のエクスポネンシャルバックオフ
          const backoffDelay = this.rateLimitDelay * Math.pow(2, attempt - 1);
          await this.sleep(backoffDelay);
        }
        
        if (attempt === this.maxRetries) {
          throw new Error(`認知度評価失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    throw new Error('最大試行回数に達しました');
  }

  /**
   * 認知度評価用のプロンプトを構築
   */
  private buildDifficultyPrompt(languageName: string, summary: string): string {
    return `あなたは技術専門家です。以下のプログラミング言語の一般的な認知度を1-5段階で評価してください：

言語名: ${languageName}
概要: ${summary}

評価基準:
1 = 超有名（JavaScript、Python、Java等）- 多くの開発者が知っている
2 = 有名（TypeScript、Go、Rust等）- IT業界では広く知られている  
3 = 普通（Scala、Erlang、F#等）- 専門分野では使われている
4 = 専門的（Prolog、Forth、APL等）- 特定の用途でのみ使用
5 = マニアック（Brainfuck、Malbolge等）- 非常に限定的な認知度

回答は数字のみで答えてください。例: 3`;
  }

  /**
   * Geminiのレスポンスから認知度レベルを抽出
   */
  private parseDifficultyFromResponse(response: string): number {
    // 数字のみを抽出
    const match = response.match(/[1-5]/);
    if (match) {
      const level = parseInt(match[0]);
      if (level >= 1 && level <= 5) {
        return level;
      }
    }
    
    // パースに失敗した場合はデフォルト値（普通）を返す
    console.warn(`⚠️  認知度レベルのパースに失敗、デフォルト値3を使用: "${response}"`);
    return 3;
  }

  /**
   * 待機関数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * APIコスト計算（参考値）
   */
  calculateEstimatedCost(requestCount: number): number {
    // Gemini 1.5 Flash-8B の料金
    const inputCostPerMTokens = 0.0375; // $0.0375/1M tokens
    const outputCostPerMTokens = 0.15;  // $0.15/1M tokens
    
    // 推定トークン数
    const averageInputTokens = 80;  // プロンプト + 説明文
    const averageOutputTokens = 15; // 30文字程度の日本語
    
    const totalInputTokens = requestCount * averageInputTokens;
    const totalOutputTokens = requestCount * averageOutputTokens;
    
    const inputCost = (totalInputTokens / 1_000_000) * inputCostPerMTokens;
    const outputCost = (totalOutputTokens / 1_000_000) * outputCostPerMTokens;
    
    return inputCost + outputCost;
  }

  /**
   * 警告一覧の取得
   */
  getWarnings(): TranslationWarning[] {
    return this.warnings;
  }

  /**
   * 警告のクリア
   */
  clearWarnings(): void {
    this.warnings = [];
  }
}
