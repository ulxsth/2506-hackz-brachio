# ターミナルウィンドウの幅・高さ可変化調査レポート

## 調査目的
Next.js + TailwindCSS で構築したSPAの「ウィンドウ部分（ターミナルUI）」を、
・ユーザーがドラッグで幅・高さを可変にできるか？
・初期表示時は画面の8割サイズで中央配置できるか？
を調査する。

---

## 1. 幅・高さの可変化（リサイズ）

### 方法1: CSSの `resize` プロパティ
- `resize` は `textarea` や `div` など一部要素で有効。
- ただし、Tailwindの `resize` ユーティリティは `overflow` も必要。
- 例: `resize both overflow-auto` で手動リサイズ可能。
- ただし、`div` 直下のflexやgrid構造だと意図通り動かない場合あり。

### 方法2: ライブラリ利用
- `react-resizable` や `re-resizable` などのReact用リサイズコンポーネントが存在。
- これらを使うと、ドラッグで直感的にウィンドウサイズを変更できる。
- Tailwindと組み合わせてデザインも調整可能。

---

## 2. 初期幅・高さを8割にして中央配置
- Tailwindで `w-[80vw] h-[80vh]` などを指定すればOK。
- `max-w-2xl` などの制約がある場合は解除・調整が必要。
- `flex items-center justify-center` で中央配置は維持可能。

---

## 3. 推奨実装例
- `re-resizable` ライブラリを使うと、
  - 初期サイズ指定（width/height）
  - 最小/最大サイズ指定
  - ドラッグでのリサイズ
  - 中央配置
  が簡単に実現できる。
- Tailwindの `resize` でも最低限のリサイズは可能だが、UXや見た目の自由度は低い。

---

## 結論
- **可変ウィンドウは「可能」**。
- シンプルな場合はTailwindの `resize both overflow-auto` でOK。
- よりリッチな体験や制御が必要なら `re-resizable` などのライブラリ導入が推奨。
- 初期サイズ8割＆中央配置もTailwindで簡単に実現可能。

---

## 参考
- [re-resizable GitHub](https://github.com/bokuweb/re-resizable)
- [TailwindCSS resize](https://tailwindcss.com/docs/resize)

---

（このレポートは2025/06/21時点の情報です）
