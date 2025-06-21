# ターミナル風SPAルートページ実装計画（2025/06/21）

## 🎯 目的
- ウィンドウ全体に収まる「ひとつのターミナルUI」をルートページ（`frontend/app/page.tsx`）に実装し、全SPA体験を一枚のターミナル上で表現する
- ターミナル内の中身（コマンド履歴や各種UI）はスクローラブルな要素とする

## 🛠️ 対象ファイル
- `frontend/app/page.tsx`（ルートページ本体）
- `frontend/app/globals.css`（全体スタイル/Tailwindカスタム）
- `frontend/components/`（必要に応じて分割する場合）
- `frontend/tailwind.config.js`（カラーパレット定義）
- `frontend/app/**/*.tsx`（各ページ・コンポーネント）
- `frontend/components/**/*.tsx`（各種UIコンポーネント）
- `frontend/styles/theme.ts`（必要に応じて同期・参照）

## 📐 実装要件
- 画面全体を覆うターミナル風UI（黒背景・緑文字・角丸・シャドウ・モノスペースフォント）
- ターミナル内はflex縦積みで、履歴部分は`overflow-y-auto`でスクロール可能
- 入力欄は下部固定、コマンド履歴や各種UIは上部に積み上げ
- レスポンシブ対応（スマホ時も快適に操作できる）
- TailwindCSSユーティリティを活用
- あまりリッチニはせず、シンプルに実装
- 既存の色指定（例: `bg-black`, `text-green-400`, `border-gray-700` など）を `terminalBg`, `terminalText`, `terminalBorder` などのカスタムカラーに置換
- Tailwindの `bg-`, `text-`, `border-` などのユーティリティでカスタムカラーを利用
- 新規色追加や変更も `tailwind.config.js` で一元管理
- 既存の `theme.ts` との重複・同期も検討

## 📝 実装手順
1. `frontend/app/page.tsx`にターミナルUIのベースを作成
2. 履歴部分を`overflow-y-auto`でスクローラブルに
3. 入力欄を下部に固定
4. 必要に応じてコンポーネント分割
5. デザイン調整・動作確認
6. サービス内で使われている色を洗い出し、`tailwind.config.js` の `extend.colors` にすべて定義
7. 各コンポーネント・ページの色指定をカスタムカラー（例: `bg-terminalBg`）に置換
8. デザイン調整・動作確認
9. `theme.ts` との役割分担・同期方法を検討

## ❓ 不明点・追加調査事項
- コマンド履歴の初期表示内容（例：ウェルカムメッセージ等）
- 入力欄のインタラクション仕様（Enterで何をするか等）
- 既存の色指定の網羅性（抜け漏れがないか）
- `theme.ts` との使い分け方針

---

この計画に沿って「実装」フェーズで作業を進めてください！
