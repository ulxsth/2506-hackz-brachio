# Terraform 環境管理ガイド 🚀

## 環境分離の方法

### 1. 📁 ディレクトリベース構成 (推奨)

```
terraform/
├── modules/
│   └── infrastructure/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── shared/
    ├── variables.tf
    └── outputs.tf
```

### 2. 🏗️ Workspaceベース構成

```bash
# workspace作成・切り替え
terraform workspace new dev
terraform workspace new staging  
terraform workspace new prod

# 現在のworkspace確認
terraform workspace show

# workspace切り替え
terraform workspace select dev
```

## 🎯 TYPE 2 LIVE用の実装

### ディレクトリ構成の作成

```bash
cd terraform
mkdir -p environments/{dev,staging,prod}
mkdir -p modules/type2live
```

### modules/type2live/main.tf
```terraform
# 共通リソース定義
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

# Supabase プロジェクト
resource "supabase_project" "main" {
  organization_id   = var.supabase_organization_id
  name              = "type2live-${var.environment}"
  database_password = var.supabase_database_password
  region            = var.supabase_region
  instance_size     = var.supabase_instance_size

  lifecycle {
    ignore_changes = [database_password]
  }
}

# Supabase 設定
resource "supabase_settings" "main" {
  project_ref = supabase_project.main.id

  api = jsonencode({
    db_schema            = "public,auth"
    db_extra_search_path = "public,extensions"
    max_rows             = var.api_max_rows
  })

  auth = jsonencode({
    site_url = var.site_url
    additional_redirect_urls = var.additional_redirect_urls
    jwt_expiry = var.jwt_expiry
    enable_signup = var.enable_signup
    enable_confirmations = var.enable_confirmations
  })
}

# Vercel プロジェクト
resource "vercel_project" "main" {
  name      = "type2live-${var.environment}"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.git_branch
  }

  root_directory = "frontend"

  # 環境変数を動的に設定
  environment = concat(
    # 共通環境変数
    [
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
        target = ["production", "preview"]  # 開発環境では除外
      },
      {
        key    = "NODE_ENV"
        value  = var.node_env
        target = ["production", "preview", "development"]
      }
    ],
    # 環境固有の環境変数
    var.additional_environment_variables
  )
}
```

### modules/type2live/variables.tf
```terraform
variable "environment" {
  description = "Environment name"
  type        = string
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

variable "supabase_instance_size" {
  description = "Supabase Instance Size"
  type        = string
  default     = "micro"
}

variable "site_url" {
  description = "Main site URL"
  type        = string
}

variable "additional_redirect_urls" {
  description = "Additional redirect URLs"
  type        = list(string)
  default     = []
}

variable "github_repo" {
  description = "GitHub repository"
  type        = string
}

variable "git_branch" {
  description = "Git branch for production"
  type        = string
  default     = "main"
}

variable "node_env" {
  description = "Node environment"
  type        = string
}

variable "api_max_rows" {
  description = "Maximum API rows"
  type        = number
  default     = 1000
}

variable "jwt_expiry" {
  description = "JWT expiry time in seconds"
  type        = number
  default     = 3600
}

variable "enable_signup" {
  description = "Enable user signup"
  type        = bool
  default     = true
}

variable "enable_confirmations" {
  description = "Enable email confirmations"
  type        = bool
  default     = false
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

### environments/dev/main.tf
```terraform
terraform {
  backend "local" {
    path = "terraform-dev.tfstate"
  }
}

provider "vercel" {}
provider "supabase" {}

module "type2live" {
  source = "../../modules/type2live"

  environment                = "dev"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  supabase_instance_size     = "micro"
  
  site_url = "http://localhost:3000"
  additional_redirect_urls = [
    "http://localhost:3000",
    "https://localhost:3000"
  ]
  
  github_repo = var.github_repo
  git_branch  = "develop"
  node_env    = "development"
  
  # 開発環境固有の設定
  api_max_rows         = 100
  enable_confirmations = false
  
  # 開発環境専用の環境変数
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
    }
  ]
}
```

### environments/dev/terraform.tfvars
```terraform
github_repo = "yotu/2506-hackz-brachio"
supabase_organization_id = "your-org-id"
supabase_database_password = "dev-password-123"
```

### environments/staging/main.tf
```terraform
terraform {
  backend "local" {
    path = "terraform-staging.tfstate"
  }
}

provider "vercel" {}
provider "supabase" {}

module "type2live" {
  source = "../../modules/type2live"

  environment                = "staging"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  supabase_instance_size     = "small"
  
  site_url = "https://type2live-staging.vercel.app"
  additional_redirect_urls = [
    "https://type2live-staging.vercel.app"
  ]
  
  github_repo = var.github_repo
  git_branch  = "staging"
  node_env    = "production"
  
  # ステージング環境固有の設定
  api_max_rows         = 500
  enable_confirmations = true
  
  additional_environment_variables = [
    {
      key    = "STAGING_MODE"
      value  = "true"
      target = ["production", "preview"]
    }
  ]
}
```

### environments/prod/main.tf
```terraform
terraform {
  backend "s3" {  # 本番はS3バックエンド推奨
    bucket = "type2live-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "vercel" {}
provider "supabase" {}

module "type2live" {
  source = "../../modules/type2live"

  environment                = "prod"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  supabase_instance_size     = "medium"
  
  site_url = "https://type2live.com"
  additional_redirect_urls = [
    "https://type2live.com",
    "https://www.type2live.com"
  ]
  
  github_repo = var.github_repo
  git_branch  = "main"
  node_env    = "production"
  
  # 本番環境固有の設定
  api_max_rows         = 1000
  enable_confirmations = true
  jwt_expiry          = 7200  # 2時間
  
  additional_environment_variables = [
    {
      key    = "PRODUCTION_MODE"
      value  = "true"
      target = ["production"]
    },
    {
      key    = "SENTRY_DSN"
      value  = var.sentry_dsn
      target = ["production", "preview"]
    }
  ]
}
```

## 🔄 環境の切り替え方法

### 1. ディレクトリベースの切り替え
```bash
# 開発環境
cd environments/dev
terraform init
terraform plan
terraform apply

# ステージング環境
cd ../staging
terraform init
terraform plan
terraform apply

# 本番環境
cd ../prod
terraform init
terraform plan
terraform apply
```

### 2. スクリプト化
```bash
#!/bin/bash
# deploy.sh

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: ./deploy.sh [dev|staging|prod]"
  exit 1
fi

cd "environments/$ENV"
terraform init
terraform plan
read -p "Apply changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  terraform apply
fi
```

## 🔧 環境変数の管理方法

### 1. TerraformからVercelへの環境変数注入
```terraform
# modules/type2live/main.tf で既に実装済み
environment = [
  {
    key    = "NEXT_PUBLIC_SUPABASE_URL"
    value  = "https://${supabase_project.main.id}.supabase.co"
    target = ["production", "preview", "development"]
  }
]
```

### 2. ローカル開発用の環境変数
```bash
# environments/dev/.env.local (gitignore対象)
NEXT_PUBLIC_SUPABASE_URL=$(terraform output -raw supabase_api_url)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(terraform output -raw supabase_anon_key)
SUPABASE_SERVICE_ROLE_KEY=$(terraform output -raw supabase_service_role_key)
```

### 3. 自動環境変数生成スクリプト
```bash
#!/bin/bash
# generate-env.sh

ENV=$1
cd "environments/$ENV"

# Terraformから値を取得
SUPABASE_URL=$(terraform output -raw supabase_api_url)
SUPABASE_ANON_KEY=$(terraform output -raw supabase_anon_key)
SUPABASE_SERVICE_KEY=$(terraform output -raw supabase_service_role_key)

# .env.local作成
cat > ../../frontend/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
NODE_ENV=development
EOF

echo "✅ Generated .env.local for $ENV environment"
```

## 🚀 実用的な運用方法

### 1. 開発フロー
```bash
# 1. 開発環境でテスト
cd environments/dev
terraform apply
../../generate-env.sh dev

# 2. フロントエンド開発
cd ../../frontend
npm run dev

# 3. ステージングにデプロイ
cd ../terraform/environments/staging
terraform apply

# 4. 本番デプロイ
cd ../prod
terraform apply
```

### 2. CI/CD統合
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
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      
      - name: Determine Environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=prod" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=dev" >> $GITHUB_OUTPUT
          fi
      
      - name: Terraform Apply
        run: |
          cd terraform/environments/${{ steps.env.outputs.environment }}
          terraform init
          terraform apply -auto-approve
        env:
          VERCEL_API_TOKEN: ${{ secrets.VERCEL_API_TOKEN }}
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

この構成により、環境ごとの完全な分離と、自動的な環境変数の注入が実現できます！🎯
