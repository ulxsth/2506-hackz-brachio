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
