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
    Project   = "type2live"
    ManagedBy = "terraform"
  }
}

# Supabase プロジェクト
resource "supabase_project" "main" {
  organization_id   = var.supabase_organization_id
  name              = "type2live"
  database_password = var.supabase_database_password
  region            = var.supabase_region

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
    max_rows             = 1000
  })

  auth = jsonencode({
    site_url                 = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://type2live.vercel.app"
    additional_redirect_urls = var.additional_redirect_urls
    jwt_expiry              = 7200
    enable_confirmations    = true
    password_min_length     = 8
  })
}

# Supabase API キーを取得
data "supabase_apikeys" "main" {
  project_ref = supabase_project.main.id
}

# Vercel プロジェクト
resource "vercel_project" "main" {
  name      = "type2live"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
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

  # 環境変数
  environment = concat(
    [
      # Supabase設定
      {
        key       = "NEXT_PUBLIC_SUPABASE_URL"
        value     = "https://${supabase_project.main.id}.supabase.co"
        target    = ["production", "preview", "development"]
        sensitive = false
      },
      {
        key       = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value     = data.supabase_apikeys.main.anon_key
        target    = ["production", "preview", "development"]
        sensitive = true
      },
      {
        key       = "SUPABASE_SERVICE_ROLE_KEY"
        value     = data.supabase_apikeys.main.service_role_key
        target    = ["production", "preview"]
        sensitive = true
      }
    ],
    # 追加の環境変数
    var.additional_environment_variables
  )

  # プレビューコメント有効化
  git_comments = {
    on_commit       = true
    on_pull_request = true
  }

  # セキュリティ設定
  git_fork_protection = true
  
  # その他の設定
  auto_assign_custom_domains = true
  enable_preview_feedback     = false
}

# カスタムドメイン設定
# Note: vercel_domain リソースは現在のVercelプロバイダーでは利用できません
# カスタムドメインはVercel Dashboardから手動で設定してください
