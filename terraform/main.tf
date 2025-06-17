terraform {
  required_version = ">= 1.0"
  
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 3.0"
    }
  }
}

provider "vercel" {
  # API Token は環境変数 VERCEL_API_TOKEN から読み込み
  # team = var.vercel_team_id  # チーム使用時
}

# Frontend (Next.js) プロジェクト
resource "vercel_project" "brachio_frontend" {
  name      = "2506-hackz-brachio-frontend"
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }

  # monorepo のため frontend ディレクトリを指定
  root_directory = "frontend"

  # ビルド設定
  build_command    = "npm run build"
  install_command  = "npm ci"
  output_directory = ".next"
  node_version     = "20.x"
  
  # monorepo 用の追加設定
  automatically_expose_system_environment_variables = true

  # 環境変数
  environment = [
    {
      key    = "NODE_ENV"
      value  = "production"
      target = ["production"]
    },
    {
      key    = "NODE_ENV"
      value  = "development"
      target = ["development"]
    }
  ]

  # プレビューコメント有効化
  git_comments = {
    on_commit       = true
    on_pull_request = true
  }

  # セキュリティ設定
  git_fork_protection = true
  
  # その他の設定
  auto_assign_custom_domains = true
  enable_preview_feedback     = true
}
