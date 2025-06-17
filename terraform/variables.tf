variable "github_repo" {
  description = "GitHub リポジトリ名 (例: username/repo-name)"
  type        = string
}

variable "vercel_team_id" {
  description = "Vercel チーム ID (チーム使用時のみ)"
  type        = string
  default     = ""
}

# Supabase 設定
variable "supabase_organization_id" {
  description = "Supabase組織ID"
  type        = string
}

variable "supabase_database_password" {
  description = "Supabaseデータベースパスワード"
  type        = string
  sensitive   = true
}

variable "supabase_instance_size" {
  description = "Supabaseインスタンスサイズ"
  type        = string
  default     = "micro"
  validation {
    condition     = contains(["micro", "small", "medium", "large"], var.supabase_instance_size)
    error_message = "Instance size must be micro, small, medium, or large."
  }
}

variable "environment" {
  description = "環境名 (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "site_url" {
  description = "サイトのメインURL"
  type        = string
}

variable "additional_redirect_urls" {
  description = "追加のリダイレクトURL"
  type        = list(string)
}

# enable_sign_ups は削除 - TYPE 2 LIVE はニックネームベースでユーザー登録不要
