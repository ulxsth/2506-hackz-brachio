# 🌸 プログラミング言語日本語翻訳システム

Gemini APIを使用してプログラミング言語の英語説明文を30文字以内の日本語要約に翻訳するスクリプト

## 📋 概要

このシステムは、Wikipedia から取得したプログラミング言語の英語説明文を、Gemini API を使用して簡潔な日本語要約（30文字以内）に翻訳します。ITタイピングゲームでの使用を想定しており、メモリ効率とコスト効率を重視した設計になっています。

## 🎯 特徴

- **高品質翻訳**: Gemini 1.5 Flash-8B による正確な翻訳
- **コスト効率**: 約612件の処理で1円未満の低コスト
- **メモリ効率**: バッチ処理による大規模データ対応
- **エラー耐性**: 包括的なエラーハンドリングとリトライ機能
- **進捗表示**: リアルタイムプログレスバーと詳細統計
- **品質管理**: 30文字制限の自動検証とサニタイゼーション

## 🔧 セットアップ

### 1. 依存関係のインストール

```bash
cd scripts/translate-to-japanese
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定してください：

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
# Gemini API設定
GEMINI_API_KEY=your_gemini_api_key_here

# 入力ファイルパス
INPUT_CSV_PATH=../scrape-programming-languages/output/programming-languages.csv

# 出力設定
OUTPUT_DIR=./output
OUTPUT_CSV_FILENAME=programming-languages-ja.csv
OUTPUT_STATS_FILENAME=translation-stats.json
OUTPUT_ERRORS_FILENAME=errors.log

# 処理設定
BATCH_SIZE=25
RATE_LIMIT_DELAY=1000
MAX_RETRIES=3
TEST_MODE=false
TEST_LIMIT=10
```

### 3. Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. API キーを生成
3. `.env` ファイルの `GEMINI_API_KEY` に設定

## 🚀 使用方法

### 基本実行

```bash
# TypeScriptをビルドして実行
npm run build
npm start

# または開発モードで直接実行
npm run dev
```

### テストモード

```bash
# 最初の10件のみ処理（テスト用）
npm run test

# または環境変数で指定
TEST_MODE=true npm run dev
```

### コマンドライン引数

```bash
# テストモードフラグ
npm run dev -- --test
```

## 📊 出力ファイル

処理完了後、以下のファイルが `output/` ディレクトリに生成されます：

### 1. `programming-languages-ja.csv`
翻訳結果を含む主要データファイル

```csv
name,wikipediaTitle,summary,japaneseSummary,categories,year
Python,Python (programming language),"Python is a high-level...",汎用プログラミング言語。AI分野で人気。,"",1991
JavaScript,JavaScript,"JavaScript is a programming...",Webページに動的機能を追加する言語。,"",1995
```

### 2. `translation-stats.json`
処理統計の詳細情報

```json
{
  "totalLanguages": 612,
  "processedLanguages": 612,
  "successfulTranslations": 580,
  "failedTranslations": 32,
  "successRate": 94.77,
  "averageResponseTime": 1250,
  "totalProcessingTime": 765000,
  "startTime": "2025-06-21T12:00:00.000Z",
  "endTime": "2025-06-21T12:12:45.000Z"
}
```

### 3. `errors.log`
エラーが発生した場合の詳細ログ

### 4. `execution-report.md`
実行レポート（Markdown形式）

## ⚡ パフォーマンス

### 処理能力
- **612件の処理時間**: 約12-15分
- **成功率**: 95%以上（通常）
- **メモリ使用量**: 最小限（バッチ処理）

### コスト
- **Gemini 1.5 Flash-8B**: $0.0375/1M input tokens, $0.15/1M output tokens
- **612件の推定コスト**: 約$0.006（1円未満）

## 🎯 品質管理

### 翻訳品質
- **文字数制限**: 30文字以内の自動検証
- **技術用語**: プログラミング言語特有の用語を正確に翻訳
- **自然な日本語**: 読みやすく理解しやすい表現

### エラーハンドリング
- **API エラー**: 自動リトライ（最大3回）
- **レート制限**: 1秒間隔での安全な実行
- **ネットワークエラー**: エクスポネンシャルバックオフ

## 🔍 トラブルシューティング

### よくある問題

#### 1. API キーエラー
```
❌ GEMINI_API_KEY が設定されていません
```
**解決**: `.env` ファイルに正しい API キーを設定してください

#### 2. 入力ファイル未発見
```
❌ 入力ファイルが見つかりません: ../scrape-programming-languages/output/programming-languages.csv
```
**解決**: スクレイピングスクリプトを先に実行してデータを生成してください

#### 3. 高い失敗率
```
⚠️ 成功率が90%未満です
```
**解決**: ネットワーク接続とAPI制限を確認してください

### デバッグ方法

```bash
# テストモードで問題を特定
TEST_MODE=true TEST_LIMIT=5 npm run dev

# 詳細ログの確認
tail -f output/errors.log
```

## 📈 カスタマイズ

### バッチサイズの調整
```env
BATCH_SIZE=10  # より安全な処理（遅い）
BATCH_SIZE=50  # より高速な処理（メモリ多め）
```

### レート制限の調整
```env
RATE_LIMIT_DELAY=500   # より高速（API制限に注意）
RATE_LIMIT_DELAY=2000  # より安全（遅い）
```

### 異なるGeminiモデルの使用
`src/gemini-client.ts` でモデルを変更：

```typescript
// より高性能だがコスト高
this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 実験的な最新モデル
this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
```

## 🤝 開発

### コード構造
```
src/
├── types.ts           # 型定義
├── gemini-client.ts   # Gemini API クライアント
├── csv-processor.ts   # CSV 処理エンジン
├── batch-processor.ts # バッチ処理システム
├── output-manager.ts  # 出力管理
└── index.ts          # メインエントリーポイント
```

### テスト実行
```bash
# 小規模テスト
npm run test

# 特定件数のテスト
TEST_LIMIT=3 npm run test
```

### ビルド
```bash
npm run build
npm run clean  # ビルドファイルの削除
```

## 📝 ライセンス

MIT License

## 🙋‍♂️ サポート

問題が発生した場合は、以下を確認してください：

1. **実行レポート**: `output/execution-report.md`
2. **エラーログ**: `output/errors.log`
3. **統計情報**: `output/translation-stats.json`

これらのファイルに詳細な診断情報が含まれています。
