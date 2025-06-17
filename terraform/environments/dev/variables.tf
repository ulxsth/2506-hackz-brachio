# 共通変数
variable "github_repo" {
  description = "GitHub リポジトリ名 (例: username/repo-name)"
  type        = string
}

variable "supabase_organization_id" {
  description = "Supabase組織ID"
  type        = string
}

variable "supabase_database_password" {
  description = "Supabaseデータベースパスワード"
  type        = string
  sensitive   = true
}

variable "supabase_region" {
  description = "Supabaseリージョン"
  type        = string
  default     = "ap-northeast-1"
}
