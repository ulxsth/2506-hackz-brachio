output "supabase_project_id" {
  description = "Supabase project ID"
  value       = supabase_project.main.id
}

output "supabase_url" {
  description = "Supabase URL"
  value       = "https://${supabase_project.main.id}.supabase.co"
}

output "supabase_anon_key" {
  description = "Supabase anonymous key"
  value       = data.supabase_apikeys.main.anon_key
  sensitive   = true
}

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.main.id
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = vercel_project.main.name
}

output "production_domain" {
  description = "Production domain"
  value       = var.custom_domain != "" ? var.custom_domain : "${vercel_project.main.name}.vercel.app"
}
