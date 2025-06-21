# Supabase it_termsテーブル「複数バッチCSVファイル統合」データ投入スクリプト 実装計画

## 目的
- translate-to-japanese/output/内に分割された複数のバッチCSVファイルを統合して読み込み
- it_termsテーブルの初期化後、すべてのバッチデータを順次投入する
- 現在の単一ファイル読み込みから、バッチファイル群（programming-languages-ja-batch-*.csv）読み込みへ変更

---

## 関連ファイル
- scripts/insert-translated-data.js（投入スクリプト本体）
- scripts/translate-to-japanese/output/programming-languages-ja-batch-*.csv（610個のバッチファイル）

---

## 実装方針
1. 単一CSVファイル読み込み処理を「複数バッチファイル読み込み」に変更
   - `programming-languages-ja.csv` → `programming-languages-ja-batch-*.csv` (batch-1〜610)
   - globパターンまたはfs.readdirでバッチファイル一覧を取得
   - 各バッチファイルを順次読み込み・パース・統合してから一括処理
2. 進捗表示の改善
   - バッチファイル読み込み進捗（例：「バッチ1/610を読み込み中...」）
   - 統合後のデータ件数表示
3. エラーハンドリング
   - 個別バッチファイルの読み込みエラー時の詳細ログ
   - 欠損バッチファイルの検出・警告

---

## 注意点
- 610個のファイルを順次読み込むため処理時間が増加
- メモリ使用量の増加に注意（必要に応じてストリーミング処理検討）

---

## 参考
- scripts/translate-to-japanese/output/（分割されたバッチファイル群）
- 現状のinsert-translated-data.js（単一ファイル読み込み）

---

# この計画に従い、実装フェーズで具体的なコード修正を行う

