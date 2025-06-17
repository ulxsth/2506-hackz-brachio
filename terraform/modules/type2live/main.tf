# TYPE 2 LIVE Infrastructure Module

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
      site_url        = "http://localhost:3000"
      git_branch      = "develop"
      enable_signups  = true
      node_env        = "development"
    }
    staging = {
      instance_size    = "small"
      max_connections  = 500
      api_max_rows    = 500
      jwt_expiry      = 7200
      site_url        = "https://staging-type2live.vercel.app"
      git_branch      = "staging"
      enable_signups  = true
      node_env        = "production"
    }
    prod = {
      instance_size    = "medium"
      max_connections  = 1000
      api_max_rows    = 1000
      jwt_expiry      = 7200
      site_url        = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://type2live.vercel.app"
      git_branch      = "main"
      enable_signups  = var.enable_signups
      node_env        = "production"
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
    enable_confirmations    = var.environment == "prod"
    password_min_length     = var.environment == "prod" ? 8 : 6
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

  # monorepo のため frontend ディレクトリを指定
  root_directory = "frontend"

  # ビルド設定
  build_command    = "npm run build"
  install_command  = "npm ci"
  output_directory = ".next"
  node_version     = "20.x"
  
  # monorepo 用の追加設定
  automatically_expose_system_environment_variables = true

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
        value  = local.current_config.node_env
        target = ["production", "preview", "development"]
      },
      {
        key    = "NEXT_PUBLIC_APP_ENV"
        value  = var.environment
        target = ["production", "preview", "development"]
      }
    ],
    # 環境固有の変数
    var.additional_environment_variables
  )

  # プレビューコメント有効化
  git_comments = {
    on_commit       = true
    on_pull_request = true
  }

  # セキュリティ設定
  git_fork_protection = var.environment == "prod"
  
  # その他の設定
  auto_assign_custom_domains = var.environment == "prod"
  enable_preview_feedback     = var.environment != "prod"
}

# カスタムドメイン（本番のみ）
resource "vercel_domain" "main" {
  count = var.environment == "prod" && var.custom_domain != "" ? 1 : 0
  
  name       = var.custom_domain
  project_id = vercel_project.main.id
}
