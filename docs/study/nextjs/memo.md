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

