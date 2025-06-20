# Supabase マイグレーション不整合問題調査レポート

## 🔍 問題の状況

### 発生した問題
- **状況**: リモートと手元のマイグレーションファイルが食い違っている
- **原因**: マイグレーションを途中でやめる方針を取ったため
- **必要な対応**: 手元のマイグレーション状態をリモートにフォースプッシュ

## 🔍 現在の状況確認

### ローカル vs リモート マイグレーション
- **ローカル**: `20250619_unified_schema.sql`, `20250620_dual_turn_system.sql`
- **リモート**: `20250617013244`, `20250617013256` (ローカルに存在しない)

### dry-run結果
```
Remote migration versions not found in local migrations directory.
supabase migration repair --status reverted 20250617013244 20250617013256
```

## 🛠️ 解決方法（3つのアプローチ）

### � 方法1: Migration Repair（推奨）

#### Step 1: 古いマイグレーションを無効化
```bash
npx supabase migration repair --status reverted 20250617013244
npx supabase migration repair --status reverted 20250617013256
```

#### Step 2: 手元のマイグレーションをプッシュ
```bash
npx supabase db push --include-all
```

### 🔄 方法2: リモートとローカルを完全に同期

#### Step 1: リモートの状態をローカルに取得
```bash
# 現在のローカルマイグレーションをバックアップ
cp -r supabase/migrations supabase/migrations_backup

# リモートからマイグレーションを取得
npx supabase db pull
```

#### Step 2: 必要に応じてマイグレーションを統合
手動でマイグレーションファイルを整理してからプッシュ

### ⚡ 方法3: 完全リセット（最終手段）

#### 注意: データが失われる可能性があります
```bash
# リモートDBを完全リセット
npx supabase db reset --linked

# ローカルマイグレーションを適用
npx supabase db push --include-all --include-seed
```

## 📋 推奨手順（方法1）

### Step 1: 認証確認
```bash
# プロジェクト接続状況確認
npx supabase projects list

# 必要に応じてログイン
npx supabase login
```

### Step 2: Migration Repair実行
```bash
# 古いマイグレーションを reverted ステータスに変更
npx supabase migration repair --status reverted 20250617013244
npx supabase migration repair --status reverted 20250617013256
```

### Step 3: 新しいマイグレーションをプッシュ
```bash
# 適用予定確認
npx supabase db push --dry-run --include-all

# 実際にプッシュ
npx supabase db push --include-all
```

### Step 4: 結果確認
```bash
# 同期完了確認
npx supabase db diff
# 結果: "No schema changes found" になればOK
```

## ⚠️ 認証問題の対処法

### パスワード認証失敗時
```bash
# 環境変数での認証
export SUPABASE_DB_PASSWORD="your_db_password"

# または設定ファイルの確認
cat .env.local | grep SUPABASE

# ダッシュボードでパスワードリセット
# https://supabase.com/dashboard/project/tgpuwjowroeoibzuktjj/settings/database
```

## 🎯 現在の状況での推奨コマンド

### 今すぐ実行すべきコマンド
```bash
# 1. 認証状態確認
npx supabase status

# 2. 古いマイグレーション無効化（パスワード要求時は入力）
npx supabase migration repair --status reverted 20250617013244
npx supabase migration repair --status reverted 20250617013256

# 3. 手元のマイグレーションをプッシュ
npx supabase db push --include-all

# 4. 完了確認
npx supabase db diff
```
