# Terraform Vercel Deployment

このディレクトリは Terraform を使用して Next.js アプリケーションを Vercel にデプロイするための設定です。

## 前提条件

1. **Vercel アカウント**: [vercel.com](https://vercel.com) でアカウント作成
2. **GitHub リポジトリ**: このプロジェクトが GitHub にプッシュされている
3. **Vercel API Token**: [Vercel Settings](https://vercel.com/account/tokens) で作成

## セットアップ

### 1. 環境変数の設定

```bash
export VERCEL_API_TOKEN="your_vercel_api_token_here"
```

### 2. 設定ファイルの準備

```bash
# サンプルファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集
vim terraform.tfvars
```

### 3. 必要な設定値

`terraform.tfvars` で以下を設定してください：

- `github_repo`: GitHub リポジトリ名 (例: "yotu/2506-hackz-brachio")
- `api_url_production`: 本番 API の URL
- `api_url_preview`: プレビュー API の URL
- `custom_domain`: カスタムドメイン（オプション）

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
