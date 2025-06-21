# Programming Languages Scraper

Wikipedia「List of programming languages」ページからプログラミング言語の情報を自動収集するスクリプト

## 🎯 概要

このスクリプトは以下の機能を提供します：

- プログラミング言語名の網羅的収集
- 各言語の簡潔な説明文取得（3文程度）
- 登場年やカテゴリ情報の抽出
- JSON/CSV形式での出力
- 詳細な統計情報とエラーレポート

## 📋 必要な環境

- Node.js 18.0.0 以上
- npm または yarn
- インターネット接続（Wikipedia API アクセス用）

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd scripts/scrape-programming-languages
npm install
```

### 2. TypeScript のビルド

```bash
npm run build
```

## 💻 使用方法

### 基本的な実行

```bash
# デフォルト設定で実行（制限なし、両形式出力）
npm run scrape

# 開発モード（TypeScript直接実行）
npm run dev
```

### オプション付き実行

```bash
# 最初の50言語のみ取得
npm run scrape -- --limit 50

# JSON形式のみで出力
npm run scrape -- --output json

# CSV形式のみで出力  
npm run scrape -- --output csv

# API呼び出し間隔を2秒に設定
npm run scrape -- --delay 2000

# リトライ回数を5回に設定
npm run scrape -- --retry 5

# 全言語を取得（明示的に制限なし）
npm run scrape:full

# 増分更新（既存データを更新）
npm run scrape:update
```

### その他のコマンド

```bash
# データの妥当性チェック
npm run validate

# 統計情報の表示
npm run stats

# 生成ファイルのクリーンアップ
npm run clean

# ヘルプの表示
npm run scrape -- --help
```

## 📊 出力形式

### JSON出力

```json
{
  "languages": [
    {
      "name": "JavaScript",
      "wikipediaTitle": "JavaScript",
      "summary": "JavaScript is a programming language that is one of the core technologies of the World Wide Web. It enables interactive web pages and is an essential part of web applications. JavaScript is a high-level, often just-in-time compiled language that conforms to the ECMAScript standard.",
      "categories": ["scripting", "web"],
      "year": 1995
    }
  ],
  "metadata": {
    "scrapedAt": "2025-06-21T20:30:00Z",
    "totalLanguages": 500,
    "successfullyScraped": 485,
    "failed": 15,
    "sourceUrl": "https://en.wikipedia.org/wiki/List_of_programming_languages",
    "duration": 125.5
  }
}
```

### CSV出力

```csv
name,wikipediaTitle,summary,categories,year
JavaScript,JavaScript,"JavaScript is a programming language...","scripting,web",1995
Python,Python (programming language),"Python is a high-level...","general-purpose,interpreted",1991
```

### 統計情報

```json
{
  "summary": {
    "totalLanguages": 500,
    "successfullyScraped": 485,
    "failedAttempts": 15,
    "successRate": "97.0%",
    "duration": "125.5 seconds"
  },
  "languagesByYear": {
    "1950s": 2,
    "1960s": 8,
    "1970s": 15,
    "1980s": 25,
    "1990s": 85,
    "2000s": 120,
    "2010s": 180,
    "2020s": 50
  },
  "textQualityDistribution": {
    "High (200+ chars)": 320,
    "Medium (100-199 chars)": 110,
    "Low (50-99 chars)": 45,
    "Very Low (<50 chars)": 10
  }
}
```

## ⚙️ 設定オプション

| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `--output` | 出力形式 (json, csv, both) | both |
| `--limit` | 取得する言語数の上限 | 制限なし |
| `--delay` | API呼び出し間隔 (ミリ秒) | 1000 |
| `--retry` | リトライ回数 | 3 |
| `--full` | 全言語を取得 | false |
| `--update` | 増分更新モード | false |

## 🔧 トラブルシューティング

### よくある問題

#### 1. API制限エラー

```
Error: Failed to fetch: 429 Too Many Requests
```

**解決方法**: `--delay` オプションで間隔を長くしてください

```bash
npm run scrape -- --delay 2000
```

#### 2. ネットワークエラー

```
Error: fetch failed
```

**解決方法**: インターネット接続を確認し、`--retry` オプションでリトライ回数を増やしてください

```bash
npm run scrape -- --retry 5
```

#### 3. メモリ不足

大量の言語を処理する際にメモリ不足になる場合は、制限を設けてください

```bash
npm run scrape -- --limit 100
```

### ログの確認

エラーの詳細は `output/statistics.json` の `errors` セクションで確認できます。

## 📁 ファイル構成

```
scripts/scrape-programming-languages/
├── src/
│   ├── index.ts             # メインエントリーポイント
│   ├── scraper.ts           # スクレイパーメインロジック
│   ├── wikipedia-client.ts  # Wikipedia APIクライアント
│   ├── parser.ts            # HTMLパーサー
│   ├── text-processor.ts    # テキスト処理ユーティリティ
│   ├── output-manager.ts    # データ出力管理
│   └── types.ts             # 型定義
├── output/
│   ├── programming-languages.json
│   ├── programming-languages.csv
│   └── statistics.json
├── dist/                    # コンパイル済みJavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 テスト

```bash
# 少数の言語でテスト実行
npm run scrape -- --limit 10

# 特定の出力形式をテスト
npm run scrape -- --limit 5 --output json
```

## 🔄 定期実行

cron等で定期的にデータを更新する場合：

```bash
# 毎週日曜日の午前2時に増分更新
0 2 * * 0 cd /path/to/project && npm run scrape:update
```

## 📚 API仕様

このスクリプトは以下のWikipedia APIを使用します：

- **REST API**: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- **Action API**: `https://en.wikipedia.org/w/api.php`

レート制限として1秒間隔でのAPI呼び出しを推奨しています。

## 🤝 貢献

バグ報告や機能要求は Issue でお知らせください。

## 📄 ライセンス

MIT License

## 🙏 謝辞

- Wikipedia APIの提供
- オープンソースコミュニティのサポート
