variable "github_repo" {
  description = "GitHub リポジトリ名 (例: username/repo-name)"
  type        = string
}

variable "vercel_team_id" {
  description = "Vercel チーム ID (チーム使用時のみ)"
  type        = string
  default     = ""
}
