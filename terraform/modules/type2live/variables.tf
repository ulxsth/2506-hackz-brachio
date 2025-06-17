variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

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

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
}

variable "custom_domain" {
  description = "Custom domain (production only)"
  type        = string
  default     = ""
}

# enable_signups は削除 - TYPE 2 LIVE はニックネームベースでユーザー登録不要

variable "additional_redirect_urls" {
  description = "Additional redirect URLs"
  type        = list(string)
  default     = []
}

variable "additional_environment_variables" {
  description = "Additional environment variables"
  type = list(object({
    key    = string
    value  = string
    target = list(string)
  }))
  default = []
}
