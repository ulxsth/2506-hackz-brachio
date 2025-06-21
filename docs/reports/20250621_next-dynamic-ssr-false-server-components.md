# next/dynamic + ssr: false + Server Components エラー調査レポート

## 概要
Next.jsのServer Componentsで`next/dynamic`の`ssr: false`を使うと、
「× `ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a client component.」
というエラーが発生する。

---

## 原因
- Next.jsのServer Components（デフォルトの.tsxファイル）はサーバーでのみ実行される。
- `next/dynamic`の`ssr: false`は「クライアントサイドのみで動的import」するためのオプション。
- サーバーコンポーネント内で`ssr: false`を使うと、Next.jsの設計上許可されていない。
- クライアントでのみ動作するライブラリ（re-resizable等）は「Client Component」でラップする必要がある。

---

## 解決策
1. `Resizable`を使う部分を`"use client"`で始まるClient Componentに分離する。
2. Server Component（layout.tsx等）からは、そのClient Componentをimportして使う。
3. もしくは、`layout.tsx`自体をClient Component化する（ただし全体に副作用が及ぶため非推奨）。

---

## 参考
- https://nextjs.org/docs/messages/client-component-import
- https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#using-third-party-client-components

---

## まとめ
- Server Componentで`next/dynamic(..., { ssr: false })`は使えない
- クライアント専用のUIはClient Componentでラップして分離する必要がある
