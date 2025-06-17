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

# 環境固有の設定 (Production)
variable "site_url" {
  description = "サイトのメインURL"
  type        = string
  default     = "https://type2live.com"  # 本番ドメイン
}

variable "additional_redirect_urls" {
  description = "追加のリダイレクトURL"
  type        = list(string)
  default     = [
    "https://type2live.com",
    "https://www.type2live.com"  # wwwサブドメイン対応
  ]
}

# enable_sign_ups は削除
# TYPE 2 LIVE はニックネームベースのゲームで、ユーザー登録機能は不要
