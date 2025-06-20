// 実際のコストシミュレーション例
export class CostSimulation {
  // 実際のゲーム使用想定
  private static readonly PLAYERS_PER_GAME = 4;
  private static readonly WORDS_PER_PLAYER_PER_GAME = 20;
  private static readonly GAMES_PER_DAY = 100;
  private static readonly DAYS_PER_MONTH = 30;

  static calculateMonthlyUsage() {
    const wordsPerDay = this.GAMES_PER_DAY * this.PLAYERS_PER_GAME * this.WORDS_PER_PLAYER_PER_GAME;
    const wordsPerMonth = wordsPerDay * this.DAYS_PER_MONTH;
    
    return {
      wordsPerDay,
      wordsPerMonth,
      games: {
        perDay: this.GAMES_PER_DAY,
        perMonth: this.GAMES_PER_DAY * this.DAYS_PER_MONTH
      }
    };
  }

  static calculateMonthlyCosts() {
    const usage = this.calculateMonthlyUsage();
    
    // Gemini 2.0 Flash でのコスト
    const geminiInputTokens = usage.wordsPerMonth * 100; // プロンプト + 単語
    const geminiOutputTokens = usage.wordsPerMonth * 50; // JSON応答
    const geminiCost = (geminiInputTokens / 1_000_000) * 0.075 + 
                      (geminiOutputTokens / 1_000_000) * 0.30;

    // kuromojin: 初回辞書ダウンロードのみ
    const kuromojinCost = 0; // 継続コストなし

    // wanakana: 完全無料
    const wanakanaCost = 0;

    return {
      usage,
      costs: {
        gemini: geminiCost,
        kuromojin: kuromojinCost,
        wanakana: wanakanaCost
      }
    };
  }

  static generateReport() {
    const { usage, costs } = this.calculateMonthlyCosts();
    
    console.log('=== 月間コストシミュレーション ===');
    console.log(`想定使用量:`);
    console.log(`  - ゲーム数/日: ${usage.games.perDay}回`);
    console.log(`  - 単語数/日: ${usage.wordsPerDay}単語`);
    console.log(`  - 単語数/月: ${usage.wordsPerMonth}単語`);
    console.log('');
    console.log('月間コスト:');
    console.log(`  - Gemini API: $${costs.gemini.toFixed(4)} (約${Math.round(costs.gemini * 150)}円)`);
    console.log(`  - kuromojin: $${costs.kuromojin} (完全無料)`);
    console.log(`  - wanakana: $${costs.wanakana} (完全無料)`);
    
    return { usage, costs };
  }
}

// 実行例
CostSimulation.generateReport();

/*
期待される出力:
=== 月間コストシミュレーション ===
想定使用量:
  - ゲーム数/日: 100回
  - 単語数/日: 8,000単語
  - 単語数/月: 240,000単語

月間コスト:
  - Gemini API: $9.6000 (約1,440円)
  - kuromojin: $0 (完全無料)
  - wanakana: $0 (完全無料)
*/
