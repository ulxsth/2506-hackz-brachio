terraform {
  required_version = ">= 1.0"
  
  backend "local" {
    path = "terraform-prod.tfstate"
  }
}

provider "vercel" {
  # API Token は環境変数 VERCEL_API_TOKEN から読み込み
}

provider "supabase" {
  # Access Token は環境変数 SUPABASE_ACCESS_TOKEN から読み込み
}

module "type2live_prod" {
  source = "../../modules/type2live"

  environment                = "prod"
  github_repo               = var.github_repo
  supabase_organization_id  = var.supabase_organization_id
  supabase_database_password = var.supabase_database_password
  supabase_region           = var.supabase_region
  site_url                  = var.site_url
  additional_redirect_urls  = var.additional_redirect_urls
  # enable_sign_ups は削除 - TYPE 2 LIVE はユーザー登録機能不要
}

output "supabase_url" {
  description = "Supabase プロジェクトURL"
  value       = module.type2live_prod.supabase_url
  sensitive   = false
}

output "supabase_anon_key" {
  description = "Supabase 匿名キー"
  value       = module.type2live_prod.supabase_anon_key
  sensitive   = true
}

output "vercel_url" {
  description = "Vercel プロジェクトURL"
  value       = module.type2live_prod.vercel_url
  sensitive   = false
}

output "vercel_deployment_url" {
  description = "Vercel デプロイメントURL"
  value       = module.type2live_prod.vercel_deployment_url
  sensitive   = false
}
