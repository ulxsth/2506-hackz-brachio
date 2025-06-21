import { GeminiClient } from './gemini-client.js';

/**
 * プログラミング言語の認知度評価を行うクラス
 */
export class DifficultyEvaluator {
  private geminiClient: GeminiClient;

  constructor(geminiClient: GeminiClient) {
    this.geminiClient = geminiClient;
  }

  /**
   * プログラミング言語の認知度を1-5段階で評価
   * @param languageName プログラミング言語名
   * @param summary 言語の概要
   * @returns 認知度レベル（1-5）
   */
  async evaluateDifficulty(languageName: string, summary: string): Promise<number> {
    return await this.geminiClient.evaluateDifficulty(languageName, summary);
  }
}
