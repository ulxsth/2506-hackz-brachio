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

output "supabase_database_url" {
  description = "Supabase Database URL"
  value       = supabase_project.main.database_url
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

output "environment_summary" {
  description = "Environment configuration summary"
  value = {
    environment       = var.environment
    supabase_url     = "https://${supabase_project.main.id}.supabase.co"
    vercel_url       = "https://${vercel_project.main.name}.vercel.app"
    git_branch       = local.current_config.git_branch
    instance_size    = local.current_config.instance_size
    site_url         = local.current_config.site_url
  }
}

# 開発環境用の便利なコマンド出力
output "dev_commands" {
  description = "Useful commands for development"
  value = var.environment == "dev" ? {
    sync_env_vars = "cd ../../frontend && vercel env pull .env.local --token YOUR_VERCEL_TOKEN"
    supabase_link = "supabase link --project-ref ${supabase_project.main.id}"
    local_supabase = "supabase start"
  } : null
}
