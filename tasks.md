# 📋 プログラミング言語翻訳スクリプト最適化計画

## 🎯 最適化目標
translate-to-japaneseスクリプトの効率化を行い、以下の課題を解決する：
1. **既存データの重複処理回避**: 出力済みデータの再処理を防ぐ
2. **メモリ効率化**: 定期的な書き出しによるメモリ節約
3. **中断耐性**: 処理途中での中断に対応できる堅牢性

## 🔍 現状分析

### 既存システム構造
- `/scripts/translate-to-japanese/src/index.ts` - メインエントリーポイント
- `/scripts/translate-to-japanese/src/sequential-processor.ts` - 逐次処理エンジン
- `/scripts/translate-to-japanese/src/csv-processor.ts` - CSV読み書き処理
- `/scripts/translate-to-japanese/src/gemini-client.ts` - Gemini API クライアント
- `/scripts/translate-to-japanese/output/programming-languages-ja.csv` - 出力済みデータ

### 課題点
1. **全件取得による無駄**: 既に翻訳済みのデータも毎回API呼び出し
2. **メモリ蓄積**: 全データをメモリに保持し続ける
3. **中断時の復旧困難**: 処理途中で止まった場合、最初からやり直し

## �️ 実装計画

### Phase 1: 既存データチェック機能
**ファイル**: `/scripts/translate-to-japanese/src/csv-processor.ts`

#### 1.1 既存出力データ読み込み機能
```typescript
// 新規メソッド追加
async readExistingOutput(): Promise<Map<string, TranslatedLanguage>>
```

#### 1.2 差分検出機能
```typescript
// 新規メソッド追加  
filterUnprocessedLanguages(
  input: ProgrammingLanguage[], 
  existing: Map<string, TranslatedLanguage>
): ProgrammingLanguage[]
```

### Phase 2: バッチ処理・定期書き出し機能
**ファイル**: `/scripts/translate-to-japanese/src/sequential-processor.ts`

#### 2.1 バッチサイズ設定
```typescript
// コンストラクタに追加
private batchSize: number = 10; // 10件ごとに書き出し
```

#### 2.2 定期保存機能
```typescript
// 新規メソッド追加
private async saveBatch(
  results: TranslatedLanguage[], 
  batchNumber: number
): Promise<void>
```

#### 2.3 プロセス管理機能
```typescript
// processAll()の修正
// - バッチごとの処理ループ
// - 定期的なファイル書き出し
// - メモリクリア
```

### Phase 3: 中断・復旧機能
**ファイル**: `/scripts/translate-to-japanese/src/progress-manager.ts` (新規)

#### 3.1 進行状況保存
```typescript
interface ProcessProgress {
  lastProcessedIndex: number;
  lastProcessedName: string;
  timestamp: string;
  totalCount: number;
  processedCount: number;
}
```

#### 3.2 復旧機能
```typescript
class ProgressManager {
  async saveProgress(progress: ProcessProgress): Promise<void>
  async loadProgress(): Promise<ProcessProgress | null>
  async clearProgress(): Promise<void>
}
```

### Phase 4: 設定・統合
**ファイル**: `/scripts/translate-to-japanese/src/types.ts`

#### 4.1 設定型拡張
```typescript
interface TranslationConfig {
  // 既存設定...
  skipExisting: boolean;        // 既存データスキップ
  batchSize: number;           // バッチサイズ
  enableResume: boolean;       // 中断復旧機能
  autoSaveInterval: number;    // 自動保存間隔
}
```

## 📁 関連ファイルパス

### 修正対象ファイル
- `/scripts/translate-to-japanese/src/csv-processor.ts` - 既存データ読み込み・差分検出
- `/scripts/translate-to-japanese/src/sequential-processor.ts` - バッチ処理・定期保存
- `/scripts/translate-to-japanese/src/types.ts` - 型定義拡張
- `/scripts/translate-to-japanese/src/index.ts` - メインロジック調整

### 新規作成ファイル
- `/scripts/translate-to-japanese/src/progress-manager.ts` - 進行状況管理
- `/scripts/translate-to-japanese/output/progress.json` - 進行状況保存

### 設定ファイル
- `/scripts/translate-to-japanese/.env` - 環境変数設定

## � 最小要件

### 必須機能
1. **既存データ確認**: 出力CSVから処理済みデータを識別
2. **差分処理**: 未処理データのみをAPI送信
3. **バッチ保存**: 10件ごとに中間結果を保存
4. **進行状況記録**: 中断位置の記録・復旧

### オプション機能
- 並列処理対応（レート制限内）
- エラーハンドリング強化
- 統計レポート詳細化

## ⚠️ 注意事項
- Gemini APIの料金制限を考慮
- 既存機能の互換性維持
- テストモードでの動作確認必須
- エラー時のデータ整合性保証
  categories: string;
  year: number | null;
}

interface TranslatedLanguage extends ProgrammingLanguage {
  japaneseSummary: string;
}

interface BatchResult {
  processed: number;
  successful: number;
  failed: number;
  errors: TranslationError[];
}

interface TranslationError {
  name: string;
  summary: string;
  error: string;
  timestamp: string;
}
```

### 2. Gemini APIクライアント (`gemini-client.ts`)
- Gemini 1.5 Flash-8B使用（最もコスト効率が良い）
- レート制限対応（1秒間隔）
- エラーハンドリングとリトライ機能
- プロンプトテンプレート管理

### 3. CSVプロセッサー (`csv-processor.ts`)
- 入力CSVファイルの読み込み
- データバリデーション
- メモリ効率的なストリーム処理対応

### 4. バッチプロセッサー (`batch-processor.ts`)
- 25件ずつのバッチ処理（メモリ効率化）
- プログレスバー表示
- 中断・再開機能
- エラー発生時の継続処理

### 5. 出力管理 (`output-manager.ts`)
- 日本語要約付きCSV出力
- 処理統計のJSON出力
- エラーログの管理

---

## 📋 実装ステップ

### Phase 1: プロジェクト初期化
1. **ディレクトリ作成**
   - `/scripts/translate-to-japanese/` 作成
   - 基本的なプロジェクト構造セットアップ

2. **package.json作成**
   - 必要な依存関係インストール
   - `@google/generative-ai` - Gemini API
   - `csv-parser` - CSV読み込み
   - `csv-writer` - CSV書き込み
   - `cli-progress` - プログレスバー

### Phase 2: コア機能実装
1. **型定義**
   - データ構造の定義
   - エラーハンドリング用型

2. **Gemini APIクライアント**
   - API キーの環境変数管理
   - プロンプト設計（30文字制限の明記）
   - レート制限とリトライロジック

3. **CSV処理エンジン**
   - 入力ファイル読み込み
   - データバリデーション

### Phase 3: バッチ処理システム
1. **メモリ効率化**
   - 25件ずつのバッチ処理
   - 中間結果の定期保存

2. **エラーハンドリング**
   - 失敗した項目のスキップ
   - 詳細なエラーログ

3. **プログレス表示**
   - リアルタイム進捗表示
   - 統計情報の更新

### Phase 4: 出力システム
1. **結果ファイル生成**
   - 日本語要約付きCSV
   - 処理統計JSON

2. **ログ管理**
   - エラーログファイル
   - 実行レポート

---

## 💰 コスト分析

### Gemini 1.5 Flash-8B（最安モデル）
- **入力**: $0.0375/1M tokens
- **出力**: $0.15/1M tokens
- **予想1件あたり**: 入力50tokens + 出力15tokens
- **612件総コスト**: 約$0.006（1円未満）

### 実行時間予想
- **API制限**: 1秒/リクエスト
- **総実行時間**: 約12分（612件 + リトライ込み）
- **バッチサイズ**: 25件ずつ（約25回のバッチ）

---

## 🔧 環境要件

### 必要な環境変数
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Node.js バージョン
- Node.js 18+ 推奨
- TypeScript 5.0+

### 入力ファイル
- `/scripts/scrape-programming-languages/output/programming-languages.csv`
- 612行のデータ（ヘッダー含む）

---

## 🎯 成功指標

### 品質指標
- **翻訳成功率**: 95%以上
- **文字数制限遵守**: 100%（30文字以内）
- **処理時間**: 15分以内
- **エラー率**: 5%以下

### 出力品質例
```
Python → "汎用プログラミング言語。AI分野で人気。"
JavaScript → "Webページに動的な機能を追加する言語。"
TypeScript → "JavaScriptに型安全性を追加した言語。"
```

---

## 🚀 次のアクション

1. **環境準備**
   - Gemini API キーの取得・設定
   - プロジェクトディレクトリの作成

2. **実装開始**
   - Phase 1から段階的に実装
   - 各段階でテスト実行

3. **品質検証**
   - 小規模テスト（10件程度）
   - 大規模実行前の動作確認

4. **本格実行**
   - 全612件の一括処理
   - 結果の品質チェック

---

## 📝 備考

### メモリ効率化の理由
- 612件すべてをメモリに載せても問題ないが、将来的な拡張性を考慮
- バッチ処理により中断・再開が可能
- エラー発生時の影響範囲を限定

### API選択の理由
- Gemini 1.5 Flash-8Bは最もコスト効率が良い
- 30文字程度の短文生成には十分な性能
- 学割適用で更にお得

この計画に基づいて、段階的にスクリプトを実装していきます 🚀✨
   - JSON形式での保存
   - CSVエクスポート機能
   - データベースへの格納

---

## 📂 ファイル構成

```
scripts/
├── scrape-programming-languages/
│   ├── src/
│   │   ├── scraper.ts          # メインスクレイパー
│   │   ├── wikipedia-client.ts # Wikipedia API クライアント
│   │   ├── parser.ts           # HTMLパーサー
│   │   ├── text-processor.ts   # テキスト処理ユーティリティ
│   │   └── types.ts            # 型定義
│   ├── output/
│   │   ├── programming-languages.json
│   │   └── programming-languages.csv
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

---

## 🛠️ 実装仕様

### 1. メインスクレイパー（scraper.ts）
```typescript
class ProgrammingLanguageScraper {
  private wikipediaClient: WikipediaClient;
  private parser: HTMLParser;
  private textProcessor: TextProcessor;

  async scrapeLanguagesList(): Promise<ProgrammingLanguage[]> {
    // 1. メインページ取得
    const listPageHtml = await this.fetchListPage();
    
    // 2. 言語リスト抽出
    const languageEntries = this.parser.extractLanguageLinks(listPageHtml);
    
    // 3. 各言語の詳細情報取得
    const languages: ProgrammingLanguage[] = [];
    for (const entry of languageEntries) {
      try {
        const details = await this.fetchLanguageDetails(entry);
        languages.push(details);
        await this.sleep(1000); // レート制限対応
      } catch (error) {
        console.warn(`Failed to fetch ${entry.name}:`, error);
      }
    }
    
    return languages;
  }

  private async fetchLanguageDetails(entry: LanguageEntry): Promise<ProgrammingLanguage> {
    const summary = await this.wikipediaClient.getPageSummary(entry.wikipediaTitle);
    const processedSummary = this.textProcessor.extractFirst3Sentences(summary.extract);
    
    return {
      name: entry.name,
      wikipediaTitle: entry.wikipediaTitle,
      summary: processedSummary,
      categories: this.parser.extractCategories(entry),
      year: this.parser.extractYear(summary.extract)
    };
  }
}
```

### 2. Wikipedia APIクライアント（wikipedia-client.ts）
```typescript
class WikipediaClient {
  private baseUrl = 'https://en.wikipedia.org/api/rest_v1';
  private userAgent = 'YourApp/1.0 (contact@example.com)';

  async getPageSummary(title: string): Promise<WikipediaSummary> {
    const url = `${this.baseUrl}/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${title}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPageContent(title: string): Promise<string> {
    // フルコンテンツが必要な場合の実装
  }
}
```

### 3. HTMLパーサー（parser.ts）
```typescript
class HTMLParser {
  extractLanguageLinks(html: string): LanguageEntry[] {
    const $ = cheerio.load(html);
    const languageEntries: LanguageEntry[] = [];

    // List of programming languagesページの構造に合わせてセレクタを調整
    $('div.mw-parser-output li a[href^="/wiki/"]').each((_, element) => {
      const $link = $(element);
      const name = $link.text().trim();
      const href = $link.attr('href');
      
      if (href && this.isValidLanguageName(name)) {
        languageEntries.push({
          name,
          wikipediaTitle: href.replace('/wiki/', '').replace(/_/g, ' ')
        });
      }
    });

    return languageEntries;
  }

  private isValidLanguageName(name: string): boolean {
    // フィルタリングロジック
    return name.length > 1 && 
           !name.includes('(') && 
           !['List', 'Category', 'Template'].some(prefix => name.startsWith(prefix));
  }

  extractCategories(entry: LanguageEntry): string[] {
    // カテゴリ情報の抽出
    return [];
  }

  extractYear(text: string): number | undefined {
    // 登場年の抽出（正規表現等を使用）
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : undefined;
  }
}
```

### 4. テキスト処理（text-processor.ts）
```typescript
class TextProcessor {
  extractFirst3Sentences(text: string): string {
    // HTMLタグの除去
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // 文の分割
    const sentences = cleanText.split(/[.!?]+\s+/)
      .filter(s => s.trim().length > 0)
      .slice(0, 3);
    
    return sentences.join('. ') + (sentences.length > 0 ? '.' : '');
  }

  sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim();
  }
}
```

---

## 📊 データ出力形式

### JSON出力例
```json
{
  "languages": [
    {
      "name": "JavaScript",
      "wikipediaTitle": "JavaScript",
      "summary": "JavaScript is a programming language that is one of the core technologies of the World Wide Web. It enables interactive web pages and is an essential part of web applications. JavaScript is a high-level, often just-in-time compiled language that conforms to the ECMAScript standard.",
      "categories": ["scripting", "web"],
      "year": 1995
    },
    {
      "name": "Python",
      "wikipediaTitle": "Python (programming language)",
      "summary": "Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically typed and garbage-collected.",
      "categories": ["general-purpose", "interpreted"],
      "year": 1991
    }
  ],
  "metadata": {
    "scrapedAt": "2025-06-21T20:30:00Z",
    "totalLanguages": 500,
    "sourceUrl": "https://en.wikipedia.org/wiki/List_of_programming_languages"
  }
}
```

### CSV出力例
```csv
name,wikipediaTitle,summary,categories,year
JavaScript,JavaScript,"JavaScript is a programming language...","""scripting,web""",1995
Python,Python (programming language),"Python is a high-level...","""general-purpose,interpreted""",1991
```

---

## ⚡ パフォーマンス考慮事項

### 1. 効率化戦略
- **バッチ処理**: 一度に複数言語を処理
- **キャッシュ機能**: 取得済みデータの再利用
- **増分更新**: 変更のあった言語のみ更新

### 2. エラー処理
- **ネットワークエラー**: 指数バックオフによるリトライ
- **レート制限**: 適切な間隔での実行
- **データ欠損**: 不完全なデータの適切な処理

### 3. 監視とログ
- **進捗表示**: プログレスバーとステータス表示
- **詳細ログ**: 取得失敗やエラーの記録
- **統計情報**: 成功率、所要時間などの記録

---

## 🔄 実行フロー

### 1. 初期セットアップ
```bash
cd scripts/scrape-programming-languages
npm install
npm run build
```

### 2. データ収集実行
```bash
npm run scrape -- --output json --limit 100
npm run scrape:full  # 全言語を取得
npm run scrape:update  # 増分更新
```

### 3. データ検証
```bash
npm run validate  # データの整合性チェック
npm run stats     # 収集統計の表示
```

---

## 📈 期待される成果

### 1. データ品質
- **網羅性**: 500以上のプログラミング言語
- **正確性**: Wikipedia準拠の信頼できる情報
- **構造化**: ゲームでの活用に適した形式

### 2. 運用効率
- **自動化**: 定期的な更新の自動実行
- **保守性**: 拡張しやすいモジュラー設計
- **監視性**: エラーと進捗の可視化

### 3. ゲーム活用
- **用語辞書**: タイピングゲームの出題語彙
- **説明表示**: 各言語の学習支援情報
- **難易度設定**: 言語の知名度による出題調整

---

## 🚀 実装スケジュール

### Week 1: 基盤実装
- [ ] プロジェクト構造の作成
- [ ] Wikipedia APIクライアント実装
- [ ] HTMLパーサーの基本機能

### Week 2: データ処理
- [ ] テキスト処理機能
- [ ] データ構造の最適化
- [ ] 出力形式の実装

### Week 3: 品質向上
- [ ] エラーハンドリング強化
- [ ] パフォーマンス最適化
- [ ] バリデーション機能

### Week 4: 統合・テスト
- [ ] ゲームシステムとの連携
- [ ] 統合テスト
- [ ] ドキュメント整備

---
  - 高速入力例: 1秒以内 → 係数3.0
  - 標準入力例: 3秒以内 → 係数2.0
  - 低速入力例: 5秒以上 → 係数1.0
- **制約係数**（制約ターン用）: 指定文字制約の動的係数（2-8の範囲）
  - 一般的文字例: "aを含む" → 係数2、"eを含む" → 係数2
  - 中程度文字例: "rを含む" → 係数3、"sを含む" → 係数3  
  - 希少文字例: "xを含む" → 係数7、"zを含む" → 係数8

### 制約システム（制約ターン用）
- **制約タイプ**: 「指定文字を含む」のみ
  - ランダムに選ばれたアルファベット一文字を含む単語（例：「r」→「react」「server」「jar」）
- **制約の組み合わせ**: 指定文字制約のみのシンプル設計
  - 辞書内に指定文字を含むIT用語が十分存在することを保証
- **動的難易度調整**: 文字の出現頻度による係数変動
- **パス機能**: 制約変更が可能（使用制限なし、クールダウン10秒）
  - 新しいランダム文字での制約生成
  - 制約ターンでのみ使用可能

### コンボシステム
- **上限値**: なし（無制限）
- **コンボリセット条件**:
  - 時間経過（10秒間入力なし）
  - 不正解入力
  - パス使用時
- パスを使用せずに連続で正解した場合、コンボ数が加算

### マッチング・ルームシステム
- **ルーム作成フロー**:
  1. ホストがあいことば（例：hoge123）を設定して部屋作成
  2. 参加者があいことばを入力して部屋に参加
  3. 全員揃ったらホストが「スタート」ボタンでゲーム開始
- **途中参加・退出**: 対応しない（ゲーム中の参加・退出は処理しない）

---

### 技術仕様

#### データベース拡張
- **turn_type**フィールドを追加：'typing' | 'constraint'
- **target_word**フィールドを追加：通常ターン用の提示単語
- **constraint_char**フィールドを追加：制約ターン用の指定文字
- **turn_start_time**フィールドを追加：タイピング速度計算用

#### ゲームロジック
- **ターン生成ロジック**: Math.random() < 0.83 ? 'typing' : 'constraint'
- **単語選択ロジック**: IT用語辞書からランダム選択（通常ターン用）
- **制約文字生成**: アルファベット26文字から重み付きランダム選択
- **タイピング速度計算**: (turn_end_time - turn_start_time) / 1000 秒

#### フロントエンド拡張
- **ターン表示UI**: ターンタイプに応じた異なる表示
- **通常ターン**: 「この単語をタイピングしてください: {target_word}」
- **制約ターン**: 「'{constraint_char}'を含むIT用語を入力してください」
- **パスボタン**: 制約ターンでのみ表示・有効

