import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse, TranslationError } from './types';

/**
 * Gemini APIクライアント
 * 30文字以内の日本語要約生成に特化
 */
export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private rateLimitDelay: number;
  private maxRetries: number;

  constructor(apiKey: string, rateLimitDelay: number = 1000, maxRetries: number = 3) {
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
        const validatedText = this.validateResponse(cleanedText);
        
        console.log(`✅ ${languageName}: "${validatedText}"`);
        
        // レート制限対応
        if (attempt < this.maxRetries) {
          await this.sleep(this.rateLimitDelay);
        }
        
        return validatedText;
        
      } catch (error) {
        console.warn(`⚠️  ${languageName} の翻訳に失敗 (試行 ${attempt}/${this.maxRetries}):`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`翻訳失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // エクスポネンシャルバックオフ
        const backoffDelay = this.rateLimitDelay * Math.pow(2, attempt - 1);
        await this.sleep(backoffDelay);
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
   * レスポンスの検証
   */
  private validateResponse(text: string): string {
    // 30文字制限チェック
    if (text.length > 30) {
      console.warn(`⚠️  文字数超過 (${text.length}文字): "${text}"`);
      // 30文字で切断して句点を追加
      text = text.substring(0, 29) + '。';
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
}
