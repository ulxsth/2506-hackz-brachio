terraform {
  required_version = ">= 1.0"
  
  backend "local" {
    path = "terraform-dev.tfstate"
  }
}

provider "vercel" {
  # API Token は環境変数 VERCEL_API_TOKEN から読み込み
}

provider "supabase" {
  # Access Token は環境変数 SUPABASE_ACCESS_TOKEN から読み込み
}

module "type2live_dev" {
  source = "../../modules/type2live"

  environment                = "dev"
  supabase_organization_id   = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  supabase_region           = var.supabase_region
  github_repo               = var.github_repo

  # 開発環境固有の設定
  additional_redirect_urls = [
    "http://localhost:3000",
    "https://localhost:3000"
  ]

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
  description = "Development environment information"
  value = {
    supabase_url = module.type2live_dev.supabase_url
    vercel_url   = module.type2live_dev.vercel_project_url
    environment  = module.type2live_dev.environment_summary
    commands     = module.type2live_dev.dev_commands
  }
}

output "supabase_anon_key" {
  description = "Supabase Anon Key for development"
  value       = module.type2live_dev.supabase_anon_key
  sensitive   = true
}

output "supabase_service_role_key" {
  description = "Supabase Service Role Key for development"
  value       = module.type2live_dev.supabase_service_role_key
  sensitive   = true
}
