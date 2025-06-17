variable "supabase_organization_id" {
  description = "Supabase Organization ID"
  type        = string
}

variable "supabase_database_password" {
  description = "Supabase Database Password"
  type        = string
  sensitive   = true
}

variable "supabase_region" {
  description = "Supabase Region"
  type        = string
  default     = "ap-northeast-1"
}

variable "custom_domain" {
  description = "Custom domain for the application"
  type        = string
  default     = ""
}

variable "additional_redirect_urls" {
  description = "Additional redirect URLs for Supabase Auth"
  type        = list(string)
  default     = []
}

variable "github_repo" {
  description = "GitHub repository name (format: owner/repo)"
  type        = string
}

variable "additional_environment_variables" {
  description = "Additional environment variables for Vercel"
  type = list(object({
    key       = string
    value     = string
    target    = list(string)
    sensitive = bool
  }))
  default = []
}
