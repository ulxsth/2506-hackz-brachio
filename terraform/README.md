# TYPE 2 LIVE Infrastructure Management 🏗️

TYPE 2 LIVE のインフラストラクチャを Terraform で管理します。環境分離のベストプラクティスに従い、dev/staging/prod の3環境を効率的に運用できます。

## 🏗️ アーキテクチャ

### 環境分離戦略
- **Development**: `develop` ブランチ → `dev` 環境
- **Staging**: `staging` ブランチ → `staging` 環境  
- **Production**: `main` ブランチ → `prod` 環境

### 管理リソース
- **Vercel**: フロントエンドデプロイ (Next.js)
- **Supabase**: バックエンド (DB, Auth, Realtime)

## 📁 ディレクトリ構造

```
terraform/
├── modules/
│   └── type2live/           # 共通インフラモジュール
│       ├── main.tf          # リソース定義
│       ├── variables.tf     # 変数定義
│       └── outputs.tf       # 出力定義
├── environments/
│   ├── dev/                 # 開発環境
│   ├── staging/             # ステージング環境（未実装）
│   └── prod/                # 本番環境（未実装）
└── README.md
```

## 🚀 セットアップ

### 1. 前提条件

- **Vercel Account**: [vercel.com](https://vercel.com)
- **Supabase Account**: [supabase.com](https://supabase.com)
- **GitHub Repository**: このプロジェクトがGitHubにプッシュ済み
- **API Tokens**:
  - [Vercel API Token](https://vercel.com/account/tokens)
  - [Supabase Access Token](https://supabase.com/dashboard/account/tokens)

### 2. 環境変数設定

```bash
# 必要なTokenをエクスポート
export VERCEL_API_TOKEN="your_vercel_token"
export SUPABASE_ACCESS_TOKEN="your_supabase_token"
```

### 3. 設定ファイル準備

```bash
# 開発環境用設定ファイル作成
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集
vim terraform.tfvars
```

### 4. 設定項目

`terraform.tfvars` で設定する値：

```hcl
github_repo = "your-username/2506-hackz-brachio"
supabase_organization_id = "your-org-id"
supabase_database_password = "secure-password-123"
supabase_region = "ap-northeast-1"
```

## 🔧 デプロイ手順

### 開発環境のデプロイ

```bash
# 1. 開発環境ディレクトリに移動
cd terraform/environments/dev

# 2. Terraform初期化
terraform init

# 3. プラン確認
terraform plan

# 4. デプロイ実行
terraform apply

# 5. 環境変数をフロントエンドに同期
cd ../../../
./sync-env.sh dev
```

### 他環境のデプロイ

```bash
# ステージング環境
cd terraform/environments/staging
terraform init && terraform apply
cd ../../../ && ./sync-env.sh staging

# 本番環境  
cd terraform/environments/prod
terraform init && terraform apply
cd ../../../ && ./sync-env.sh prod
```

## 🔄 環境変数の同期

### 自動同期スクリプト

```bash
# 開発環境の環境変数を同期
./sync-env.sh dev

# ステージング環境の環境変数を同期
./sync-env.sh staging

# 本番環境の環境変数を同期
./sync-env.sh prod
```

このスクリプトは以下を実行します：
1. Terraformから最新の設定値を取得
2. フロントエンド用の `.env.local` ファイルを生成
3. Supabase CLI の設定 (開発環境のみ)

### 手動での環境変数確認

```bash
cd terraform/environments/dev

# Supabase URL確認
terraform output supabase_url

# 機密情報の確認
terraform output -raw supabase_anon_key
terraform output -raw supabase_service_role_key
```

## 📊 運用フロー

### 1. 日常的な開発

```bash
# 1. 機能開発
git checkout -b feature/new-function
# ... 開発 ...
git push origin feature/new-function
# → Vercel自動プレビューデプロイ

# 2. 開発環境テスト
git checkout develop
git merge feature/new-function
git push origin develop
# → dev環境で動作確認

# 3. インフラ変更が必要な場合
cd terraform/environments/dev
terraform plan
terraform apply
./sync-env.sh dev
```

### 2. リリースフロー

```bash
# 1. ステージング環境デプロイ
git checkout staging
git merge develop
git push origin staging

# 2. ステージング環境でテスト
cd terraform/environments/staging
terraform apply

# 3. 本番環境デプロイ
git checkout main  
git merge staging
git push origin main

# 4. 本番環境でデプロイ
cd terraform/environments/prod
terraform apply
```

## 🛠️ トラブルシューティング

### よくある問題

1. **Terraform state が見つからない**
   ```bash
   cd terraform/environments/dev
   terraform init
   ```

2. **Supabase認証エラー**
   ```bash
   # Access Tokenを再確認
   echo $SUPABASE_ACCESS_TOKEN
   
   # 新しいTokenを取得して設定
   export SUPABASE_ACCESS_TOKEN="new_token"
   ```

3. **環境変数が反映されない**
   ```bash
   # 強制的に再同期
   ./sync-env.sh dev
   
   # フロントエンド再起動
   cd frontend
   npm run dev
   ```

### 状態確認コマンド

```bash
# Terraform状態確認
terraform show

# Vercelプロジェクト確認  
vercel projects list

# Supabaseプロジェクト確認
supabase projects list
```

## 🔒 セキュリティ

### 機密情報の管理

- `terraform.tfvars` は **gitignore** に含まれています
- API Tokens は環境変数で管理
- パスワードは Terraform state で暗号化保存

### 本番環境の保護

- 本番環境では追加の承認フローを設定予定
- S3バックエンドでstate管理
- IAMによるアクセス制御

## 📚 参考資料

- [Environment Separation Design](../docs/reports/environment-separation-design.md)
- [Supabase Terraform Analysis](../docs/reports/supabase-terraform-analysis.md)
- [Terraform Environment Management](../docs/reports/terraform-environment-management.md)

## デプロイ手順

### 初回デプロイ

```bash
# Terraform 初期化
terraform init

# プラン確認
terraform plan

# デプロイ実行
terraform apply
```

### 更新デプロイ

```bash
terraform plan
terraform apply
```

## 主要なリソース

- **vercel_project**: メインの Next.js プロジェクト
- **vercel_project_domain**: カスタムドメイン設定
- **vercel_project (API)**: API サーバー（オプション）

## 自動デプロイ

Git 連携により以下が自動で実行されます：

- `main` ブランチへの push → 本番デプロイ
- PR 作成 → プレビューデプロイ
- その他のブランチへの push → プレビューデプロイ

## トラブルシューティング

### よくあるエラー

1. **API Token エラー**: `VERCEL_API_TOKEN` 環境変数を確認
2. **リポジトリアクセスエラー**: GitHub の Vercel アプリ連携を確認
3. **ドメインエラー**: DNS 設定を確認

### ログ確認

```bash
# Terraform ログ
terraform show

# Vercel ダッシュボード
# https://vercel.com/dashboard でデプロイ状況を確認
```

## ファイル構成

```
terraform/
├── main.tf                    # メイン設定
├── variables.tf               # 変数定義
├── outputs.tf                 # 出力値
├── terraform.tfvars.example   # 設定サンプル
├── terraform.tfvars           # 実際の設定（Git除外）
└── README.md                  # このファイル
```
