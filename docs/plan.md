
# Supabase it_termsテーブル初期化付きデータ投入スクリプト 実装計画

## 目的
- 単語データ投入時、it_termsテーブルの中身を一度全削除（初期化）してから新規データのみを挿入する
- 重複防止・クリーンな状態で辞書データを管理

---

## 関連ファイル
- scripts/insert-translated-data.js（投入スクリプト本体）
- supabase/migrations/（テーブル定義）

---

## 実装方針
1. スクリプトのmain処理の最初で`it_terms`テーブルをtruncate/deleteする処理を追加
   - `await supabase.from('it_terms').delete().neq('id', 0)` などで全件削除
   - 削除後、通常通りCSV→it_terms形式変換→insert処理を実行
2. 削除・挿入の進捗をログ出力
3. エラー時は即時停止・詳細ログ

---

---

## 参考
- scripts/insert-translated-data.js（現状の重複除外ロジック）

---

# この計画に従い、実装フェーズで具体的なコード修正を行う

