# プログラミング言語データ収集スクリプト計画

## 📋 プロジェクト概要
Wikipedia「List of programming languages」ページからプログラミング言語の名称と説明文（上位3文）を自動収集するスクリプトの実装計画

## 🎯 目標
- プログラミング言語名の網羅的収集
- 各言語の簡潔な説明文取得
- ゲーム用語辞書への活用
- 自動更新可能な仕組みの構築

---

## 🔍 技術アプローチ

### Phase 1: リストページの解析
1. **メインページ取得**
   - URL: `https://en.wikipedia.org/wiki/List_of_programming_languages`
   - HTMLパースによるプログラミング言語リストの抽出
   - 言語名とWikipediaリンクの収集

2. **データ構造の設計**
   ```typescript
   interface ProgrammingLanguage {
     name: string;           // 言語名（例: "JavaScript"）
     wikipediaTitle: string; // Wikipediaページタイトル
     summary: string;        // 3文程度の要約
     categories?: string[];  // カテゴリ（汎用、関数型等）
     year?: number;         // 登場年
   }
   ```

### Phase 2: 個別言語情報の取得
1. **Wikipedia REST API活用**
   - エンドポイント: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
   - 各言語ページから構造化データを取得
   - 要約（extract）から最初の3文を抽出

2. **レート制限対応**
   - 1秒間隔でのAPI呼び出し（Wikipedia推奨）
   - 並行処理による効率化（適度な制限下で）
   - エラーハンドリングとリトライ機能

### Phase 3: データ処理と保存
1. **テキスト処理**
   - HTMLタグの除去
   - 3文への分割と選択
   - 不適切な内容のフィルタリング

2. **データ出力**
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

