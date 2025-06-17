# enable_sign_ups 設定の詳細解説 🔐

## 📋 `enable_sign_ups` とは？

`enable_sign_ups` は **Supabase認証システム**において、新規ユーザーの**自己登録（サインアップ）を許可するかどうか**を制御する重要な設定です。

## 🎯 具体的な機能

### ✅ `enable_sign_ups = true` の場合
- 誰でも自由にアカウントを作成可能
- サインアップフォームからの新規登録が有効
- Email/パスワード、ソーシャルログインでの新規登録が可能

### ❌ `enable_sign_ups = false` の場合
- 新規登録を完全に無効化
- 既存ユーザーのログインは引き続き可能
- **招待制**や**管理者による手動追加**のみでユーザー作成

## 🏗️ 現在のTerraform実装

### コード箇所
```hcl
# terraform/modules/type2live/main.tf:88
auth = jsonencode({
  site_url                 = local.current_config.site_url
  additional_redirect_urls = concat([local.current_config.site_url], var.additional_redirect_urls)
  jwt_expiry              = local.current_config.jwt_expiry
  enable_signup           = local.current_config.enable_signups  # 👈 ここ！
  enable_confirmations    = var.environment == "prod"
  password_min_length     = var.environment == "prod" ? 8 : 6
})
```

### 環境別設定値

| 環境 | 設定値 | 理由 |
|------|--------|------|
| **Development** | `true` | 開発時に自由にテストアカウント作成 🔧 |
| **Staging** | `true` | QA・テスト用アカウント作成 🧪 |
| **Production** | `false` | セキュリティ強化・招待制運用 🔒 |

## 🎮 TYPE 2 LIVE での活用例

### 開発環境 (dev)
```typescript
// フロントエンド: 自由にサインアップ可能
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})
// ✅ 成功: 新規アカウント作成
```

### 本番環境 (prod)
```typescript
// フロントエンド: サインアップ試行
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com', 
  password: 'password123'
})
// ❌ エラー: "Signups not allowed for this instance"
```

## 🔐 セキュリティ上の利点

### 本番環境での `false` 設定
1. **スパム防止**: 無作為なアカウント作成を防止
2. **品質管理**: 招待されたユーザーのみ参加
3. **リソース管理**: 想定外のユーザー増加を制御
4. **コミュニティ管理**: 管理者による参加者選別

## 💡 運用パターン

### パターン1: 段階的リリース
```
開発: enable_sign_ups = true   (開発・テスト)
      ↓
ステージング: enable_sign_ups = true   (ベータテスト)
      ↓  
本番: enable_sign_ups = false  (招待制正式運用)
```

### パターン2: イベント連動
```typescript
// 特定期間のみサインアップ開放
if (isEventPeriod) {
  // Terraform で一時的に true に変更
  enable_sign_ups = true
} else {
  enable_sign_ups = false  
}
```

## 🛠️ 管理者による手動ユーザー追加

`enable_sign_ups = false` でも管理者は以下の方法でユーザー追加可能：

1. **Supabase Dashboard**: 管理画面から直接追加
2. **Admin API**: サーバーサイドからの招待
3. **招待システム**: 招待メール送信機能

```javascript
// Admin API でのユーザー招待例
const { data, error } = await supabase.auth.admin.inviteUserByEmail(
  'newuser@example.com'
)
```

## 🎯 TYPE 2 LIVE でのおすすめ設定

```hcl
# 開発段階
dev: enable_sign_ups = true      # 自由な開発・テスト
staging: enable_sign_ups = true  # QA・ベータテスト

# 正式リリース後  
prod: enable_sign_ups = false    # 品質重視の招待制
```

---

*この設定により、開発効率とセキュリティのバランスを最適化できます！* 🎮✨

*報告日時: 2025-06-17*  
*対応者: GitHub Copilot* 🤖
