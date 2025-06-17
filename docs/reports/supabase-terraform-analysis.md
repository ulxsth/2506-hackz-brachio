# Supabase Terraform管理調査 🚀

## 概要
Supabase の Infrastructure as Code (IaC) 対応について調査しました。

## 🟢 結論: Terraform管理は可能！

### 公式Terraform Provider
- **プロバイダー**: `supabase/supabase`
- **最新バージョン**: v1.5.1 (2024年12月現在)
- **公式サポート**: ✅ Supabase公式提供

### 📦 管理可能なリソース

#### 1. Project管理
```terraform
resource "supabase_project" "main" {
  organization_id   = "your-org-id"
  name              = "type-2-live"
  database_password = var.db_password
  region            = "ap-northeast-1"  # 東京リージョン
  instance_size     = "micro"

  lifecycle {
    ignore_changes = [
      database_password,
      instance_size,
    ]
  }
}
```

#### 2. Settings管理
```terraform
resource "supabase_settings" "main" {
  project_ref = supabase_project.main.id

  api = jsonencode({
    db_schema            = "public,auth,storage"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })
  
  auth = jsonencode({
    site_url                = "https://type2live.vercel.app"
    additional_redirect_urls = ["http://localhost:3000"]
    jwt_expiry              = 3600
  })
}
```

#### 3. Branch管理
```terraform
resource "supabase_branch" "staging" {
  project_ref = supabase_project.main.id
  name        = "staging"
}
```

## 🏗️ TYPE 2 LIVE向けTerraform設定例

### メインプロジェクト
```terraform
terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.5"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}

# メインプロジェクト
resource "supabase_project" "type2live" {
  organization_id   = var.organization_id
  name              = "type-2-live-${var.environment}"
  database_password = var.database_password
  region            = "ap-northeast-1"
  instance_size     = var.instance_size

  lifecycle {
    ignore_changes = [database_password]
  }
}

# API設定
resource "supabase_settings" "type2live" {
  project_ref = supabase_project.type2live.id

  api = jsonencode({
    db_schema            = "public,auth"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })

  auth = jsonencode({
    site_url = var.site_url
    additional_redirect_urls = var.additional_redirect_urls
    jwt_expiry = 3600
    enable_signup = true
    enable_confirmations = false
  })

  # Realtime設定
  realtime = jsonencode({
    max_concurrent_users = 500
    max_events_per_second = 100
  })
}
```

### 環境別設定
```terraform
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_size" {
  description = "Instance size"
  type        = string
  default     = "micro"
  validation {
    condition     = contains(["micro", "small", "medium", "large"], var.instance_size)
    error_message = "Instance size must be micro, small, medium, or large."
  }
}

# outputs.tf
output "project_url" {
  value = "https://${supabase_project.type2live.id}.supabase.co"
}

output "project_ref" {
  value = supabase_project.type2live.id
}

output "anon_key" {
  value     = supabase_project.type2live.anon_key
  sensitive = true
}
```

## ⚠️ 制限事項

### 管理できないリソース
1. **データベーススキーマ**: テーブル作成・変更
2. **Functions**: Supabase Functions
3. **Storage buckets**: ストレージバケット
4. **Row Level Security**: RLSポリシー

### 推奨併用ツール
```bash
# データベース管理
supabase db push          # スキーマ変更
supabase functions deploy # Functions デプロイ

# Terraform管理
terraform plan           # プロジェクト設定変更
terraform apply          # インフラ適用
```

## 🚀 実装ステップ

### 1. 既存プロジェクトのImport
```bash
# 現在のSupabaseプロジェクトをTerraform管理下に
terraform import supabase_project.type2live YOUR_PROJECT_REF
```

### 2. 環境分離
```
environments/
├── dev/
│   ├── main.tf
│   ├── terraform.tfvars
│   └── backend.tf
├── staging/
│   ├── main.tf
│   ├── terraform.tfvars
│   └── backend.tf
└── prod/
    ├── main.tf
    ├── terraform.tfvars
    └── backend.tf
```

### 3. CI/CD統合
```yaml
# .github/workflows/terraform.yml
name: Terraform
on:
  push:
    branches: [main]
    paths: [terraform/**]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Plan
        run: terraform plan
        env:
          TF_VAR_supabase_access_token: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - name: Terraform Apply
        run: terraform apply -auto-approve
        if: github.ref == 'refs/heads/main'
```

## 📊 メリット・デメリット

### ✅ メリット
- **バージョン管理**: プロジェクト設定をGitで管理
- **環境一貫性**: dev/staging/prodの設定統一
- **自動化**: CI/CDでのインフラ管理
- **監査**: 変更履歴の追跡

### ⚠️ デメリット
- **部分対応**: すべてのSupabase機能は管理不可
- **学習コスト**: Terraform習得が必要
- **複雑性**: 小規模プロジェクトには過剰

## 🎯 TYPE 2 LIVEでの推奨

### ハイブリッド管理
1. **Terraform**: プロジェクト・設定・環境管理
2. **Supabase CLI**: スキーマ・Functions・RLS
3. **Git**: 両方の設定をバージョン管理

この構成により、インフラとアプリケーションの両方を効率的に管理できます！
