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

## 📝 環境変数の永続化設定

### 方法1: bashrc/zshrc を使用（推奨）

```bash
# ホームディレクトリの設定ファイルに追加
echo 'export VERCEL_API_TOKEN="your_vercel_token"' >> ~/.bashrc
echo 'export SUPABASE_ACCESS_TOKEN="your_supabase_token"' >> ~/.bashrc

# 設定を反映
source ~/.bashrc

# zsh を使用している場合は ~/.zshrc を使用
echo 'export VERCEL_API_TOKEN="your_vercel_token"' >> ~/.zshrc
echo 'export SUPABASE_ACCESS_TOKEN="your_supabase_token"' >> ~/.zshrc
source ~/.zshrc
```

### 方法2: .env ファイルを使用

```bash
# プロジェクトルートに .env ファイル作成
cp .env.example .env

# .env ファイルを編集
nano .env  # または code .env

# .env を読み込む
set -a && source .env && set +a
```

### 方法3: direnv を使用（開発者向け）

```bash
# direnv をインストール
# macOS
brew install direnv

# Ubuntu/Debian
sudo apt install direnv

# シェル設定に追加
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc  # bash の場合
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc   # zsh の場合

# 設定を反映
source ~/.bashrc  # または source ~/.zshrc

# プロジェクトルートに .envrc ファイル作成
cat > .envrc << 'EOF'
export VERCEL_API_TOKEN=your_vercel_token
export SUPABASE_ACCESS_TOKEN=your_supabase_token
EOF

# 許可設定
direnv allow
```

### 環境変数の確認

```bash
# 設定されているか確認
echo "VERCEL_API_TOKEN: ${VERCEL_API_TOKEN:+設定済み}"
echo "SUPABASE_ACCESS_TOKEN: ${SUPABASE_ACCESS_TOKEN:+設定済み}"

# 実際の値を確認（デバッグ時のみ）
# echo $VERCEL_API_TOKEN
# echo $SUPABASE_ACCESS_TOKEN
```

## 🚨 トラブルシューティング

### プロバイダーエラーの解決

エラー例：
```
Error: Failed to query available provider packages
Could not retrieve the list of available versions for provider hashicorp/vercel
```

**解決方法：**
1. `.terraform` ディレクトリを削除
2. `terraform init` を再実行

```bash
rm -rf .terraform
terraform init
```

### 環境変数が認識されない場合

```bash
# 1. 環境変数を再設定
unset VERCEL_API_TOKEN SUPABASE_ACCESS_TOKEN
export VERCEL_API_TOKEN="your_token"
export SUPABASE_ACCESS_TOKEN="your_token"

# 2. 新しいターミナルセッションで確認
echo $VERCEL_API_TOKEN

# 3. それでも問題がある場合は、terraform に直接渡す
TF_VAR_vercel_token="your_token" terraform plan
```

### terraform.tfvars の重複エラー

エラー例：
```
Error: Attribute redefined
The argument "github_repo" was already set at terraform.tfvars:2,1-12. 
Each argument may be set only once.
```

**原因：** terraform.tfvarsファイル内で同じ変数が複数回定義されている

**解決方法：**
```bash
# terraform.tfvars ファイルを確認
cat terraform.tfvars

# 重複した行を削除（エディタで編集）
nano terraform.tfvars
```

**正しい terraform.tfvars の例：**
```hcl
# 各変数は1回のみ定義
github_repo = "your-username/repo-name"
supabase_organization_id = "your-org-id"
supabase_database_password = "your-password"
supabase_region = "ap-northeast-1"
```

### よくあるエラーと対処法

| エラーメッセージ | 原因 | 解決方法 |
|------------------|------|----------|
| `provider registry ... does not have a provider` | プロバイダーソース未指定 | `required_providers` ブロックを追加 |
| `Authentication failed` | トークンが無効 | トークンを再生成・再設定 |
| `terraform.tfvars: No such file` | 設定ファイル未作成 | `terraform.tfvars.example` をコピー |

### Supabase/Vercel プロバイダーの属性エラー

エラー例：
```
Error: Unsupported attribute
This object has no argument, nested block, or exported attribute named "anon_key".
```

**原因：** Supabaseプロバイダーの最新版では、API キーは `supabase_apikeys` データソースから取得する必要があります

**解決方法：**
1. 古い直接参照を削除
2. `data.supabase_apikeys` データソースを使用

```hcl
# ❌ 古い方法
value = supabase_project.main.anon_key

# ✅ 正しい方法
data "supabase_apikeys" "main" {
  project_ref = supabase_project.main.id
}

value = data.supabase_apikeys.main.anon_key
```

### vercel_domain リソースエラー

エラー例：
```
Error: Invalid resource type
The provider vercel/vercel does not support resource type "vercel_domain".
```

**原因：** Vercelプロバイダーで `vercel_domain` リソースが利用できません

**解決方法：**
- カスタムドメインは **Vercel Dashboard** から手動で設定
- Terraform設定をコメントアウト

```hcl
# カスタムドメインは手動設定
# resource "vercel_domain" "main" { ... }
```

### Supabase 無料プランのinstance_sizeエラー

エラー例：
```
Error: Client Error
Unable to create project, got status 402: 
{"message":"Instance size cannot be specified for free plan organizations."}
```

**原因：** Supabase無料プランでは `instance_size` パラメータを指定できません

**解決方法：**
`supabase_project` リソースから `instance_size` を削除

```hcl
resource "supabase_project" "main" {
  organization_id   = var.supabase_organization_id
  name              = "project-name"
  database_password = var.supabase_database_password
  region            = var.supabase_region
  # instance_size は無料プランでは指定不可
  # instance_size   = "micro"
}
```

**📝 補足：**
- 無料プランでは自動的に最小インスタンスが使用されます
- 有料プランでは `instance_size` を指定可能：`micro`, `small`, `medium`, `large`, `xlarge`, `2xlarge`, `4xlarge`, `8xlarge`, `12xlarge`, `16xlarge`
