# 日本語化対応計画
## UX重要部分の日本語ローカライゼーション

### 対象の特定
#### 重要度：高（ユーザーが直接操作・理解する部分）
1. **ボタンテキスト**
   - "Back", "Submit", "Join Room", "Create Room", "Start Game", "End Game"
   - "Play Again", "Back to Menu", "Leave Room"

2. **プレースホルダー・入力フィールド**
   - "Enter room code...", "Enter nickname...", "Type IT term..."

3. **ユーザーメッセージ・説明**
   - "Loading...", "Connecting...", "Error occurred"
   - "Failed to join", "Need more players", "Waiting for host"

4. **ゲーム状態表示**
   - "Normal Turn", "Constraint Turn", "WINNER", "Game Complete"
   - "Final Rankings", "Your Detailed Stats"

#### 重要度：中（UI説明・ガイダンス）
1. **ヒントセクション**
   - "Hints", "Game Rules", "Game Info"
   - エラーメッセージ詳細

2. **ページタイトル・ヘッダー**
   - "join-room", "dual-turn-game", "game-results"

#### 重要度：低（保持するもの）
1. **技術用語・ラベル**
   - "Room Code", "HOST", "YOU", "ONLINE"
   - figletロゴ、コマンドライン表示

### 修正対象ファイル

#### 最優先
1. **frontend/app/join-room/page.tsx**
   - ボタン: "Back" → "戻る", "Join Room" → "参加"
   - プレースホルダー: "Enter room code..." → "ルームコードを入力..."
   - メッセージ: "Loading..." → "読み込み中..."

2. **frontend/app/room/page.tsx**
   - ボタン: "Leave Room" → "退室", "Start Game!" → "ゲーム開始！"
   - メッセージ: "Waiting for players..." → "プレイヤー待機中..."

3. **frontend/app/game/page.tsx**
   - ボタン: "Submit" → "送信", "Pass" → "パス", "End Game" → "終了"
   - ターン表示: "Normal Turn" → "通常ターン", "Constraint Turn" → "制約ターン"

4. **frontend/app/result/page.tsx**
   - ボタン: "Play Again" → "もう一度", "Back to Menu" → "メニューへ"
   - 表示: "WINNER" → "優勝者", "Final Rankings" → "最終順位"

#### 次優先
5. **frontend/app/create-room/page.tsx**
6. **frontend/app/menu/page.tsx**

### 実装方針
1. **段階的実装** - ページごとに分けて確実に修正
2. **一貫性重視** - 同じ意味の言葉は統一表記
3. **自然な日本語** - 機械翻訳ではなく、日本人が自然に使う表現
4. **ターミナル感維持** - 技術的な雰囲気は保持

### 用語統一ルール
- "Loading..." → "読み込み中..."
- "Back" → "戻る"
- "Submit" → "送信"
- "Join" → "参加"
- "Create" → "作成"
- "Start" → "開始"
- "Game" → "ゲーム"
- "Room" → "ルーム"
- "Player" → "プレイヤー"
- "Error" → "エラー"
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

---

# layout.tsxのClient Component分離によるre-resizable対応 実装計画

## 目的
- re-resizableを使ったウィンドウ可変化をNext.jsのServer Components構成で正しく動作させる
- Server Componentでエラーとなる部分をClient Componentに分離し、UI/UXを維持

---

## 関連ファイル
- frontend/app/layout.tsx（全体レイアウト、Server Component）
- frontend/components/TerminalWindow.tsx（新規作成、Client Componentとして分離）
- frontend/components/Resizable.tsx（re-resizableラッパー）

---

## 実装方針
1. `frontend/components/TerminalWindow.tsx`を新規作成し、`"use client"`で開始
   - Resizableでラップしたウィンドウ本体・ヘッダー・children描画をこの中に移動
   - propsでchildrenを受け取る
2. `layout.tsx`はServer Componentのまま、`TerminalWindow`をimportしてchildrenを渡す
3. 必要に応じてスタイル・propsを調整

---

## メリット
- Server/Clientの責務分離が明確になり、Next.jsの設計に沿った構成となる
- 今後のUI拡張やSSR対応も容易

---

## 参考
- docs/reports/20250621_next-dynamic-ssr-false-server-components.md

---

# この計画に従い、実装フェーズで具体的なコード修正を行う

---

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

# ターミナルUIコンポーネント最小限セット 実装計画

## 目的
- 文字だけのターミナルUIからUX向上のため、最小限のコンポーネントを作成
- ターミナル風デザインを保ちつつ、ボタン・フォーム要素などの操作性を向上
- 統一感のあるデザインシステムを構築

---

## 関連ファイル
- frontend/components/ui/（新規ディレクトリ）
  - Button.tsx（ボタンコンポーネント）
  - Input.tsx（入力フィールド）
  - Select.tsx（セレクトボックス）
  - TextArea.tsx（テキストエリア）
  - Card.tsx（カード・パネル）
  - Modal.tsx（モーダル・ダイアログ）
- frontend/tailwind.config.js（コンポーネント用カスタムクラス追加）
- frontend/app/globals.css（共通スタイル拡張）

---

## 実装方針
### 1. コンポーネント設計思想
- ターミナル風デザインを維持（角ばった境界線、monospaceフォント、緑系色調）
- hovrer/focus/activeステートでのフィードバック
- サイズバリエーション（sm/md/lg）とカラーバリエーション（primary/secondary/danger/success）

### 2. 作成コンポーネント
#### Button.tsx
- variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- size: 'sm' | 'md' | 'lg'
- ターミナル風角ばったデザイン、hover時の境界線強調

#### Input.tsx
- type: 'text' | 'password' | 'email' | 'number'
- ターミナル風境界線、フォーカス時の色変化
- エラーステート対応

#### Select.tsx / TextArea.tsx
- 同様のターミナル風デザインで統一

#### Card.tsx
- 情報表示用パネル、ターミナルウィンドウ風
- ヘッダー・ボディ・フッター構造

#### Modal.tsx
- オーバーレイ付きモーダル、ターミナルウィンドウデザイン

### 3. 既存ページへの適用
- frontend/app/page.tsx（ルートページ）でのボタン・フォーム要素置き換え
- frontend/app/menu/, frontend/app/room/ 等での活用

---

## 注意点
- ターミナル風デザインの一貫性維持
- アクセシビリティ（aria-label, keyboard navigation等）
- レスポンシブ対応

---

## 参考
- 既存のtailwind.config.js（terminalBg, terminalText等のカラーパレット）
- 現在のターミナルUIデザイン

---

# この計画に従い、実装フェーズで具体的なコンポーネント作成を行う

