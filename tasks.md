
---

# ターミナルUIウィンドウ「幅・高さ可変化」実装計画

## 目的
- ターミナルUIウィンドウ部分（layout.tsx内）の幅・高さをユーザーがドラッグで可変にできるようにする
- 初期表示は画面の8割サイズ・中央配置
- TailwindCSSのみで実装する案と、`re-resizable`等のライブラリ利用案の2パターンを検討

---

## 関連ファイル
- frontend/app/layout.tsx（ウィンドウ本体・ヘッダー・全体レイアウト）
- frontend/app/globals.css（カスタムCSS追加時）
- frontend/tailwind.config.js（必要に応じてカスタムクラス追加）
- frontend/package.json（ライブラリ導入時）

---

## 実装方針
### 1. TailwindCSSのみで実装する場合
- `resize`クラス（`resize-x`, `resize-y`, `resize`）と`overflow-auto`を利用
- ウィンドウ本体divに`resize`と`overflow-auto`を付与
- `min-w-[300px] max-w-[100vw] min-h-[200px] max-h-[100vh]`等で最小/最大サイズを制御
- 初期サイズは`w-4/5 h-4/5`で中央配置
- スマホ・タブレット時は`resize-none`で固定化も検討

### 2. ライブラリ（re-resizable等）を使う場合
- `re-resizable`をインストールし、ウィンドウ本体を`Resizable`でラップ
- `defaultSize`で初期サイズ指定、`minWidth`/`maxWidth`等で制御
- `onResize`でサイズ変更時の挙動を制御
- スマホ・タブレット時は`enable`でリサイズ無効化

---

## 不明点・要検討事項
- スマホ・タブレット時のリサイズ可否（ユーザビリティ観点で要検討）
- ウィンドウサイズを状態管理する必要性（今後の拡張性）
- ライブラリ導入のパフォーマンス・バンドルサイズ影響
- ウィンドウ外クリック時の挙動（今は不要）

---

## 参考
- docs/reports/20250621_terminal-window-resize-investigation.md（調査レポート）

---

# この計画に従い、実装フェーズで具体的なコード修正を行う
