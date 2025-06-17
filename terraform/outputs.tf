output "frontend_project_id" {
  description = "Frontend プロジェクトの ID"
  value       = vercel_project.brachio_frontend.id
}

output "frontend_project_url" {
  description = "Frontend プロジェクトの URL"
  value       = "https://vercel.com/${vercel_project.brachio_frontend.name}"
}

output "production_domain" {
  description = "本番ドメイン"
  value       = "${vercel_project.brachio_frontend.name}.vercel.app"
}

output "vercel_project_settings" {
  description = "プロジェクト設定の概要"
  value = {
    frontend_name     = vercel_project.brachio_frontend.name
    framework         = vercel_project.brachio_frontend.framework
    root_directory    = vercel_project.brachio_frontend.root_directory
    production_branch = vercel_project.brachio_frontend.git_repository.production_branch
  }
}

# Supabase outputs
output "supabase_project_id" {
  description = "Supabase プロジェクト ID"
  value       = supabase_project.type2live.id
}

output "supabase_project_url" {
  description = "Supabase プロジェクト URL"
  value       = "https://${supabase_project.type2live.id}.supabase.co"
}

output "supabase_api_url" {
  description = "Supabase API URL"
  value       = "https://${supabase_project.type2live.id}.supabase.co"
}

output "supabase_anon_key" {
  description = "Supabase Anon Key (フロントエンド用)"
  value       = supabase_project.type2live.anon_key
  sensitive   = true
}

output "supabase_service_role_key" {
  description = "Supabase Service Role Key (サーバー用)"
  value       = supabase_project.type2live.service_role_key
  sensitive   = true
}

output "supabase_database_url" {
  description = "Supabase Database URL"
  value       = supabase_project.type2live.database_url
  sensitive   = true
}
