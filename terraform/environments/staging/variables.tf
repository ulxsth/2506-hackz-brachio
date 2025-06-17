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

# 環境固有の設定 (Staging)
variable "site_url" {
  description = "サイトのメインURL"
  type        = string
  default     = "https://staging-type2live.vercel.app"
}

variable "additional_redirect_urls" {
  description = "追加のリダイレクトURL"
  type        = list(string)
  default     = [
    "https://staging-type2live.vercel.app",
    "https://staging-*.vercel.app"
  ]
}

# enable_sign_ups は削除
# TYPE 2 LIVE はニックネームベースのゲームで、ユーザー登録機能は不要
