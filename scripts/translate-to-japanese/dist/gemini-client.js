"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiClient {
    genAI;
    model;
    rateLimitDelay;
    maxRetries;
    constructor(apiKey, rateLimitDelay = 1000, maxRetries = 3) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash-8b",
            generationConfig: {
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 50,
            }
        });
        this.rateLimitDelay = rateLimitDelay;
        this.maxRetries = maxRetries;
    }
    async translateToJapanese(languageName, englishSummary) {
        const prompt = this.buildPrompt(languageName, englishSummary);
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔄 ${languageName} を翻訳中... (試行 ${attempt}/${this.maxRetries})`);
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const cleanedText = this.cleanResponse(text);
                const validatedText = this.validateResponse(cleanedText);
                console.log(`✅ ${languageName}: "${validatedText}"`);
                if (attempt < this.maxRetries) {
                    await this.sleep(this.rateLimitDelay);
                }
                return validatedText;
            }
            catch (error) {
                console.warn(`⚠️  ${languageName} の翻訳に失敗 (試行 ${attempt}/${this.maxRetries}):`, error);
                if (attempt === this.maxRetries) {
                    throw new Error(`翻訳失敗: ${error instanceof Error ? error.message : String(error)}`);
                }
                const backoffDelay = this.rateLimitDelay * Math.pow(2, attempt - 1);
                await this.sleep(backoffDelay);
            }
        }
        throw new Error('最大試行回数に達しました');
    }
    async translateBatch(languages) {
        const results = [];
        for (const language of languages) {
            try {
                const japaneseSummary = await this.translateToJapanese(language.name, language.summary);
                results.push({
                    name: language.name,
                    japaneseSummary
                });
            }
            catch (error) {
                console.error(`❌ ${language.name} のバッチ翻訳に失敗:`, error);
                results.push({
                    name: language.name,
                    japaneseSummary: '翻訳エラー',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
            await this.sleep(this.rateLimitDelay);
        }
        return results;
    }
    buildPrompt(languageName, englishSummary) {
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
    cleanResponse(text) {
        return text
            .trim()
            .replace(/^["'`]|["'`]$/g, '')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    validateResponse(text) {
        if (text.length > 30) {
            console.warn(`⚠️  文字数超過 (${text.length}文字): "${text}"`);
            text = text.substring(0, 29) + '。';
        }
        if (text.length < 5) {
            throw new Error('翻訳結果が短すぎます');
        }
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
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    calculateEstimatedCost(requestCount) {
        const inputCostPerMTokens = 0.0375;
        const outputCostPerMTokens = 0.15;
        const averageInputTokens = 80;
        const averageOutputTokens = 15;
        const totalInputTokens = requestCount * averageInputTokens;
        const totalOutputTokens = requestCount * averageOutputTokens;
        const inputCost = (totalInputTokens / 1_000_000) * inputCostPerMTokens;
        const outputCost = (totalOutputTokens / 1_000_000) * outputCostPerMTokens;
        return inputCost + outputCost;
    }
}
exports.GeminiClient = GeminiClient;
//# sourceMappingURL=gemini-client.js.map