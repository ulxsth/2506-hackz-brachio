# 参照
https://nextjs.org/learn

## 対象
- スタイリング
- 最適化
- ルーティング
- データフェッチ
- 検索、ページ区切り
- データの変更
- エラー処理
- フォーム検証、アクセシビリティ
- 認証
- メタデータ

# デモ
`nextjs-dashboard` をいじりながら進める。

## フォルダ構造 (一例)
- /app
  - /lib: util, fetcher など
  - /ui: UI コンポーネント
  - /public: 静的アセット
  
# スタイリング
## tailwind
tailwindcss util class を使用する
```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## css modules
異なるスタイルファイル間での衝突を防ぐことが期待できる
```css
/* home.module.css */
.shape {
  height: 0;
  width: 0;
  border-bottom: 30px solid black;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
}
```

## clsx
クラス名を条件分岐で切り替えできる

# フォント
フォントはパフォーマンスに強く影響する
- **累積レイアウトシフト**：Google が SEO の指標に用いる、フォールバックフォントからシステムフォントに置き換えた際に生じるレイアウトのズレの大きさ

Next は、`next/font` モジュールによってアプリケーション内のフォントを自動的に最適化する

```ts
// fonts.ts
import { Inter } from 'next/font/google';

// subsets: 使用する文字だけを絞り込んで用いる
export const inter = Inter({ subsets: ['latin'] });
```

```ts
// layout.tsx
import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

# 画像
`/public` に設置
`next/image` の `<Image>` を使用することで、レイアウト最適や各種最適化がつく

```jsx
<Image
  src="/hero-desktop.png"
  width={1000}
  height={760}
  className="hidden md:block"
  alt="Screenshots of the dashboard project showing desktop version"
/>
```

## レスポンシブ
プレフィクスを設けることで、条件に応じた場合のみ適応するクラスが設定できる
このとき、**プレフィクスがない側がモバイルに適用されるクラスである**点に注意する
```jsx
// for Desktop
<Image
  src="/hero-desktop.png"
  width={1000}
  height={760}
  className="hidden md:block"
  alt="Screenshots of the dashboard project showing desktop version"
/>

// for Mobile
<Image
  src="/hero-mobile.png"
  width={560}
  height={620}
  className="block md:hidden"
  alt="Screenshots of the dashboard project showing mobile version"
/>
```

# ルーティング
Next.js では **ファイルシステムルーティング** を採用している

```
- app (/)
  - dashboard (/dashboard)
    - invoices (/dashboard/invoices)
```

## page.tsx
各フォルダ内に設置された `page.tsx` が、各ルートのページコンポーネントとして扱われる

逆に言えば、app 内にフォルダが作成されても、 `page.tsx` （または`route.ts`）を設置しなければルーティングに反映されることはない
https://nextjs.org/docs/app/getting-started/project-structure#colocation

また、`_` を頭につける、`()` で囲むことで明示的にルーティングから除外することもできる（例：`_hoge`, `(hoge)`）

## layout.tsx
各フォルダ内に設置された `layout.tsx` は、そのフォルダおよびフォルダ内のすべてのネストされたフォルダ内の `page.tsx` の規定レイアウトとなる

レイアウトは **ナビゲーション時に再レンダリングされない**
つまり、ページ遷移前後で同一のパーツをサーバから取り寄せることがなく、不要な処理・通信が発生しない