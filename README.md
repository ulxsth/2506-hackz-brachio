# TYPE 2 LIVE
リアルタイム100人規模のタイピングゲーム「TYPE 2 LIVE」のリポジトリです。

## Debugging
### 1. 依存関係のインストール
```bash
# フロントエンド
cd frontend && npm install

# バックエンド（API）
cd api && npm install
```

### 2. Supabase セットアップ
```bash
# Supabase CLI でローカル開発環境を起動
npx supabase start

# マイグレーション適用（初回のみ）
npx supabase db reset

# 型情報生成
cd frontend && npm run db:types
```

### 3. 環境変数設定
```bash
# frontend/.env.local を作成
cp frontend/.env.example frontend/.env.local

# 以下を設定（ローカル開発の場合）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start で表示されるanon key>
```

### 4. 開発サーバー起動
```bash
# フロントエンド（別ターミナル）
cd frontend && npm run dev

# バックエンド（別ターミナル）
cd api && npm run dev
```

## 📊 Ports

|Service|Port|URL|
|-|-|-|
|Frontend|3000|http://localhost:3000|
|Backend API|3001|http://localhost:3001|
|Supabase API|54321|http://localhost:54321|
|Supabase DB|54322|postgresql://postgres:postgres@localhost:54322/postgres|

## Database & Migration
### Supabase CLI

```bash
# ローカル Supabase スタック起動/停止
npx supabase start    # 初回起動（Dockerイメージダウンロード含む）
npx supabase stop     # 停止

# マイグレーション管理
npx supabase migration new <migration_name>  # 新しいマイグレーション作成
npx supabase db reset                        # ローカルDBリセット + マイグレーション適用
npx supabase db push                         # リモートDBにマイグレーション適用

# 型生成
npx supabase gen types typescript --local > frontend/lib/database.types.ts

# リモートプロジェクト連携
npx supabase login                           # Supabaseにログイン
npx supabase link --project-ref <project>   # リモートプロジェクトとリンク
npx supabase db pull                         # リモートスキーマを取得
```
