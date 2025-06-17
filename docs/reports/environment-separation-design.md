# Vercel/Supabase 環境分離ベストプラクティス設計 🏗️

## 📋 調査結果サマリー

### Vercelのベストプラクティス
- **Git Branch Based**: ブランチベースの自動デプロイ
- **Environment Variables**: 環境別の変数管理
- **Preview Deployments**: PR毎の自動プレビュー
- **Production Branch**: mainブランチでの本番デプロイ

### Supabaseのベストプラクティス
- **Project Separation**: 環境毎に独立したプロジェクト
- **CLI Integration**: マイグレーション管理
- **Branch Linking**: 各環境に対応するプロジェクトのリンク

## 🎯 TYPE 2 LIVE 環境分離戦略

### 1. Git ブランチ戦略
```
main          # 本番環境 (Production)
├─ staging    # ステージング環境 (Staging)  
├─ develop    # 開発環境 (Development)
└─ feature/*  # 機能開発 (Preview)
```

### 2. 環境マッピング
| Environment | Git Branch | Vercel | Supabase Project | Domain |
|-------------|------------|--------|------------------|---------|
| Development | develop | Preview | type2live-dev | dev-type2live.vercel.app |
| Staging | staging | Preview | type2live-staging | staging-type2live.vercel.app |
| Production | main | Production | type2live-prod | type2live.com |
| Feature | feature/* | Preview | type2live-dev | feature-xyz-type2live.vercel.app |

## 🏗️ Terraform実装設計

### ディレクトリ構造
```
terraform/
├── modules/
│   └── type2live/           # 共通モジュール
│       ├── main.tf          # リソース定義
│       ├── variables.tf     # 変数定義
│       ├── outputs.tf       # 出力定義
│       └── locals.tf        # ローカル値
├── environments/
│   ├── dev/                 # 開発環境
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/             # ステージング環境
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/                # 本番環境
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── shared/
    ├── backend.tf           # 共通バックエンド設定
    └── versions.tf          # プロバイダーバージョン
```

### modules/type2live/main.tf
```terraform
terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 3.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.5"
    }
  }
}

# ローカル値定義
locals {
  common_tags = {
    Project     = "type2live"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # 環境別設定
  env_config = {
    dev = {
      instance_size    = "micro"
      max_connections  = 200
      api_max_rows    = 100
      jwt_expiry      = 3600
      site_url        = "https://dev-type2live.vercel.app"
      git_branch      = "develop"
      enable_signups  = true
      cors_origins    = ["http://localhost:3000", "https://dev-type2live.vercel.app"]
    }
    staging = {
      instance_size    = "small"
      max_connections  = 500
      api_max_rows    = 500
      jwt_expiry      = 7200
      site_url        = "https://staging-type2live.vercel.app"
      git_branch      = "staging"
      enable_signups  = true
      cors_origins    = ["https://staging-type2live.vercel.app"]
    }
    prod = {
      instance_size    = "medium"
      max_connections  = 1000
      api_max_rows    = 1000
      jwt_expiry      = 7200
      site_url        = "https://type2live.com"
      git_branch      = "main"
      enable_signups  = var.enable_signups
      cors_origins    = ["https://type2live.com", "https://www.type2live.com"]
    }
  }

  current_config = local.env_config[var.environment]
}

# Supabase プロジェクト
resource "supabase_project" "main" {
  organization_id   = var.supabase_organization_id
  name              = "type2live-${var.environment}"
  database_password = var.supabase_database_password
  region            = var.supabase_region
  instance_size     = local.current_config.instance_size

  lifecycle {
    ignore_changes = [database_password]
  }
}

# Supabase 設定
resource "supabase_settings" "main" {
  project_ref = supabase_project.main.id

  api = jsonencode({
    db_schema            = "public,auth,storage"
    db_extra_search_path = "public,extensions"
    max_rows             = local.current_config.api_max_rows
  })

  auth = jsonencode({
    site_url                 = local.current_config.site_url
    additional_redirect_urls = concat([local.current_config.site_url], var.additional_redirect_urls)
    jwt_expiry              = local.current_config.jwt_expiry
    enable_signup           = local.current_config.enable_signups
    enable_confirmations    = var.environment == "prod" ? true : false
    password_min_length     = var.environment == "prod" ? 8 : 6
    
    # OAuth設定（環境別）
    external_google_enabled = var.environment != "dev"
    external_github_enabled = var.environment != "dev"
  })

  # CORS設定
  cors = jsonencode({
    allowed_origins = local.current_config.cors_origins
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers = ["Authorization", "Content-Type", "X-Client-Info"]
  })
}

# Vercel プロジェクト
resource "vercel_project" "main" {
  name      = "type2live-${var.environment}"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = local.current_config.git_branch
  }

  root_directory = "frontend"

  # ビルド設定
  build_command    = "npm run build"
  install_command  = "npm ci"
  output_directory = ".next"
  node_version     = "20.x"

  # 環境変数（自動生成）
  environment = concat(
    [
      # Supabase設定
      {
        key    = "NEXT_PUBLIC_SUPABASE_URL"
        value  = "https://${supabase_project.main.id}.supabase.co"
        target = ["production", "preview", "development"]
      },
      {
        key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value  = supabase_project.main.anon_key
        target = ["production", "preview", "development"]
      },
      {
        key    = "SUPABASE_SERVICE_ROLE_KEY"
        value  = supabase_project.main.service_role_key
        target = var.environment == "dev" ? ["development"] : ["production", "preview"]
      },
      # アプリケーション設定
      {
        key    = "NODE_ENV"
        value  = var.environment == "prod" ? "production" : "development"
        target = ["production", "preview", "development"]
      },
      {
        key    = "NEXT_PUBLIC_APP_ENV"
        value  = var.environment
        target = ["production", "preview", "development"]
      },
      {
        key    = "NEXT_PUBLIC_APP_VERSION"
        value  = var.app_version
        target = ["production", "preview", "development"]
      }
    ],
    # 環境固有の変数
    var.additional_environment_variables
  )

  # プレビュー設定
  git_comments = {
    on_commit       = true
    on_pull_request = true
  }

  # セキュリティ設定
  git_fork_protection = var.environment == "prod"
  
  # その他設定
  auto_assign_custom_domains = var.environment == "prod"
  enable_preview_feedback     = var.environment != "prod"
}

# カスタムドメイン（本番のみ）
resource "vercel_domain" "main" {
  count = var.environment == "prod" && var.custom_domain != "" ? 1 : 0
  
  name       = var.custom_domain
  project_id = vercel_project.main.id
}
```

### modules/type2live/variables.tf
```terraform
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "supabase_organization_id" {
  description = "Supabase Organization ID"
  type        = string
}

variable "supabase_database_password" {
  description = "Supabase Database Password"
  type        = string
  sensitive   = true
}

variable "supabase_region" {
  description = "Supabase Region"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
}

variable "app_version" {
  description = "Application version"
  type        = string
  default     = "1.0.0"
}

variable "custom_domain" {
  description = "Custom domain (production only)"
  type        = string
  default     = ""
}

variable "enable_signups" {
  description = "Enable user signups (production only)"
  type        = bool
  default     = true
}

variable "additional_redirect_urls" {
  description = "Additional redirect URLs"
  type        = list(string)
  default     = []
}

variable "additional_environment_variables" {
  description = "Additional environment variables"
  type = list(object({
    key    = string
    value  = string
    target = list(string)
  }))
  default = []
}
```

### modules/type2live/outputs.tf
```terraform
output "supabase_project_id" {
  description = "Supabase Project ID"
  value       = supabase_project.main.id
}

output "supabase_url" {
  description = "Supabase URL"
  value       = "https://${supabase_project.main.id}.supabase.co"
}

output "supabase_anon_key" {
  description = "Supabase Anonymous Key"
  value       = supabase_project.main.anon_key
  sensitive   = true
}

output "supabase_service_role_key" {
  description = "Supabase Service Role Key"
  value       = supabase_project.main.service_role_key
  sensitive   = true
}

output "vercel_project_id" {
  description = "Vercel Project ID"
  value       = vercel_project.main.id
}

output "vercel_project_url" {
  description = "Vercel Project URL"
  value       = "https://${vercel_project.main.name}.vercel.app"
}

output "environment_config" {
  description = "Environment configuration summary"
  value = {
    environment   = var.environment
    supabase_url = "https://${supabase_project.main.id}.supabase.co"
    vercel_url   = "https://${vercel_project.main.name}.vercel.app"
    git_branch   = local.current_config.git_branch
  }
}
```

### environments/dev/main.tf
```terraform
terraform {
  backend "local" {
    path = "terraform-dev.tfstate"
  }
}

provider "vercel" {}
provider "supabase" {}

module "type2live_dev" {
  source = "../../modules/type2live"

  environment                = "dev"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  github_repo               = var.github_repo
  app_version               = var.app_version

  # 開発環境固有の環境変数
  additional_environment_variables = [
    {
      key    = "DEBUG"
      value  = "true"
      target = ["development"]
    },
    {
      key    = "LOG_LEVEL"
      value  = "debug"
      target = ["development"]
    },
    {
      key    = "NEXT_PUBLIC_ENABLE_MOCK_DATA"
      value  = "true"
      target = ["development"]
    }
  ]
}

# 開発環境用の出力
output "dev_info" {
  value = {
    supabase_url    = module.type2live_dev.supabase_url
    vercel_url      = module.type2live_dev.vercel_project_url
    local_env_setup = "Run: cd ../../frontend && vercel env pull .env.local"
  }
}
```

### environments/staging/main.tf
```terraform
terraform {
  backend "s3" {
    bucket = "type2live-terraform-state"
    key    = "staging/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "vercel" {}
provider "supabase" {}

module "type2live_staging" {
  source = "../../modules/type2live"

  environment                = "staging"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  github_repo               = var.github_repo
  app_version               = var.app_version

  # ステージング環境固有の設定
  additional_redirect_urls = [
    "https://staging-type2live.vercel.app"
  ]

  additional_environment_variables = [
    {
      key    = "NEXT_PUBLIC_STAGING_MODE"
      value  = "true"
      target = ["production", "preview"]
    },
    {
      key    = "SENTRY_DSN"
      value  = var.sentry_dsn_staging
      target = ["production", "preview"]
    }
  ]
}
```

### environments/prod/main.tf
```terraform
terraform {
  backend "s3" {
    bucket = "type2live-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "vercel" {}
provider "supabase" {}

module "type2live_prod" {
  source = "../../modules/type2live"

  environment                = "prod"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  github_repo               = var.github_repo
  app_version               = var.app_version
  custom_domain             = var.custom_domain
  enable_signups            = var.enable_signups

  additional_redirect_urls = [
    "https://type2live.com",
    "https://www.type2live.com"
  ]

  additional_environment_variables = [
    {
      key    = "SENTRY_DSN"
      value  = var.sentry_dsn_prod
      target = ["production"]
    },
    {
      key    = "GOOGLE_ANALYTICS_ID"
      value  = var.google_analytics_id
      target = ["production"]
    },
    {
      key    = "NEXT_PUBLIC_HOTJAR_ID"
      value  = var.hotjar_id
      target = ["production"]
    }
  ]
}
```

## 🚀 運用ワークフロー

### 1. 開発フロー
```bash
# 1. 機能開発
git checkout -b feature/new-typing-system
# ... 開発作業 ...
git push origin feature/new-typing-system
# → Vercel が自動でプレビューデプロイ

# 2. 開発環境テスト
git checkout develop
git merge feature/new-typing-system
git push origin develop
# → dev環境で統合テスト

# 3. ステージング環境デプロイ
git checkout staging
git merge develop
git push origin staging
# → staging環境で受け入れテスト

# 4. 本番環境デプロイ
git checkout main
git merge staging
git push origin main
# → 本番環境デプロイ
```

### 2. インフラ管理フロー
```bash
# 開発環境更新
cd terraform/environments/dev
terraform plan
terraform apply

# ステージング環境更新
cd ../staging
terraform plan
terraform apply

# 本番環境更新（承認必要）
cd ../prod
terraform plan
# レビュー・承認後
terraform apply
```

### 3. 環境変数の同期
```bash
#!/bin/bash
# sync-env.sh
ENV=$1

cd "terraform/environments/$ENV"
terraform output -json > env-output.json

# Vercelから最新の環境変数を取得
vercel env pull ../../frontend/.env.$ENV --token $VERCEL_TOKEN

echo "✅ Environment variables synced for $ENV"
```

## 🔒 セキュリティ設定

### 1. 環境別アクセス制御
```terraform
# RLS ポリシー（環境別）
resource "null_resource" "setup_rls" {
  provisioner "local-exec" {
    command = <<EOF
psql "${supabase_project.main.database_url}" << 'EOSQL'

-- 環境別のデータ分離
CREATE POLICY "${var.environment}_data_isolation" ON public.rooms
  FOR ALL USING (environment = '${var.environment}');

-- 開発環境では全アクセス許可
${var.environment == "dev" ? "ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;" : ""}

EOSQL
EOF
  }
}
```

### 2. CI/CD セキュリティ
```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure
on:
  push:
    branches: [main, staging, develop]
    paths: [terraform/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'production' || github.ref_name }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      
      - name: Deploy
        run: |
          cd terraform/environments/${{ github.ref_name == 'main' && 'prod' || github.ref_name }}
          terraform init
          terraform plan
          terraform apply -auto-approve
        env:
          VERCEL_API_TOKEN: ${{ secrets.VERCEL_API_TOKEN }}
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

この設計により、型安全で効率的な環境分離が実現できます！🎯
