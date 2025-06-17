# Supabase CLI セットアップ手順 🚀

## 1. CLIインストール（不要 - npxを使用）
```bash
# グローバルインストール不要！npxで直接実行
```

## 2. プロジェクト初期化
```bash
npx supabase init
```

## 3. ログイン
```bash
npx supabase login
# Personal Access Token を入力
```

## 4. 型生成
```bash
npx supabase gen types typescript --project-id "<PROJECT_REF>" > frontend/database.types.ts
```

## 5. マイグレーション管理
```bash
# 新しいマイグレーション作成
npx supabase migration new <migration_name>

# ローカルDBにマイグレーション適用
npx supabase db reset

# 本番DBにマイグレーション適用（リモート接続後）
npx supabase db push
```

## 6. ローカル開発環境
```bash
# ローカルSupabaseスタック起動
npx supabase start

# 型生成（ローカル）
npx supabase gen types typescript --local > frontend/database.types.ts

# ローカル環境停止
npx supabase stop
```

## 7. リモートプロジェクト連携
```bash
# プロジェクトリンク
npx supabase link --project-ref <PROJECT_REF>

# 型生成（リモート）
npx supabase gen types typescript --project-id "<PROJECT_REF>" > frontend/database.types.ts
```

## 🎉 セットアップ完了！

### ✅ 完了済み作業
1. **Supabase CLI導入** - npxで利用可能
2. **プロジェクト初期化** - `supabase/` フォルダ作成
3. **マイグレーション作成** - 既存スキーマをSQL化
4. **ローカルDB起動** - `supabase start` でテスト環境構築
5. **型生成完了** - `frontend/lib/database.types.ts` に型安全定義
6. **クライアント更新** - Supabaseクライアントに型適用

### 📁 生成されたファイル構成
```
supabase/
├── config.toml                    # Supabase設定
├── migrations/
│   └── 20250617142304_initial_schema.sql  # 初期スキーマ
└── .gitignore

frontend/lib/
├── database.types.ts              # 生成された型定義
└── supabase.ts                    # 型安全なクライアント
```

### 🎯 次に取るべき行動

#### 1. **リモートプロジェクト連携** 🔗
```bash
# .env.local に実際のプロジェクト情報を設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# リモートプロジェクトとリンク
npx supabase link --project-ref your-project-ref

# リモートに既存スキーマがある場合
npx supabase db pull

# ローカル変更をリモートに適用
npx supabase db push
```

#### 2. **型生成の自動化** 🔄
```bash
# ローカル開発時
cd frontend && npm run db:types

# リモート本番環境から
cd frontend && npm run db:types:remote
```

#### 3. **開発・テスト** 🧪
```bash
# ローカルSupabase起動
npx supabase start

# フロントエンド開発サーバー起動
cd frontend && npm run dev
```

### 🎮 型安全な開発例

```typescript
// 型安全なクエリ
const { data: rooms } = await supabase
  .from('rooms')
  .select('*')  // 型が自動推論される！

// 型安全なリアルタイム通信
const channel = supabase
  .channel('room-changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'rooms' },
    (payload: { new: Tables<'rooms'> }) => {
      // payload.new が完全型安全！🎯
    }
  )
```

---
*Setup completed on: 2025-06-17*
*Status: 🎉 Ready for Development!*
