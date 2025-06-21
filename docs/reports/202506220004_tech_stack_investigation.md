# 技術構成調査レポート
*調査日: 2025-06-22*

## 🔍 現在の技術構成まとめ

### 📁 プロジェクト構造
**Monorepo構成**: 
- `frontend/` - Next.js フロントエンド
- `supabase/` - データベース・バックエンド設定
- `terraform/` - インフラ定義（Vercel）
- `scripts/` - 補助スクリプト

---

## 🎯 フロントエンド技術スタック

### 🚀 メインフレームワーク
- **Next.js 15.3.3** - App Router使用
- **React 19.0.0** - 最新版使用
- **TypeScript 5.x** - 完全TypeScript化

### 🎨 UI・スタイリング
- **Tailwind CSS 3.4.17** - ユーティリティファーストCSS
- **PostCSS 8.x** - CSS処理
- **re-resizable 6.11.2** - リサイズ可能コンポーネント
- **wanakana 5.3.1** - 日本語文字変換（ひらがな・カタカナ・ローマ字）

### 🔧 開発ツール
- **autoprefixer** - CSS自動ベンダープレフィックス
- **clsx 2.1.1** - 条件付きクラス名結合
- **tailwind-merge 3.3.1** - Tailwindクラス競合解決

### 🧠 状態管理
- **Jotai 2.12.5** - アトミックな状態管理

---

## 🗄️ バックエンド・データベース

### 📊 データベース
- **Supabase** - PostgreSQL + リアルタイム機能
- **ローカル開発**: `http://localhost:54321`
- **Studio**: `http://localhost:54323`

### 🔄 リアルタイム機能
- **Supabase Realtime** - WebSocket通信
- **@supabase/supabase-js 2.50.0** - クライアントライブラリ

### 🛠️ データベース管理
- **マイグレーション管理**: Supabase CLI
- **型生成**: 自動TypeScript型生成対応
- **シードデータ**: `supabase/seed.sql`

---

## 🎮 ゲーム特化機能

### 📝 タイピング機能
- **wanakana** - 日本語入力変換サポート
- IT用語辞書システム統合

### 🎯 ゲームシステム
- **デュアルターンシステム**:
  - 通常タイピングターン（83%）
  - 制約ターン（17%）
- **リアルタイムマルチプレイヤー**
- **スコア・コンボシステム**

---

## 🏗️ インフラ・デプロイメント

### ☁️ ホスティング
- **Vercel** - フロントエンドデプロイ
- **Terraform** - インフラ as Code
- **GitHub連携** - 自動デプロイパイプライン

### 📦 パッケージマネージャー
- **pnpm** - 高速パッケージマネージャー（ロックファイル存在）
- **npm** - 補助的に使用

---

## 📋 データベーススキーマ（最新）

### 🎲 ゲーム関連テーブル
1. **rooms** - ゲームルーム管理
2. **room_players** - プレイヤー参加状況
3. **game_sessions** - ゲームセッション（ターンシステム対応）
4. **word_submissions** - 単語提出履歴
5. **it_terms** - IT用語辞書

### 🔄 最新マイグレーション
- `20250619_unified_schema.sql` - 統合スキーマ
- `20250620_dual_turn_system.sql` - **デュアルターンシステム対応**
- `20250621_remove_romaji_aliases.sql` - ローマ字エイリアス削除

### 📊 デュアルターンシステム拡張（重要）
**game_sessions テーブル新フィールド**:
- `current_turn_type`: 'typing' | 'constraint'
- `current_target_word`: 通常ターン用提示単語
- `current_constraint_char`: 制約ターン用指定文字
- `turn_start_time`: ターン開始時刻
- `turn_sequence_number`: ターン連番
- `turn_metadata`: 追加ターン情報(JSON)

---

## 🔧 開発環境設定

### 🌍 ポート構成
- **Frontend**: 3000 (`http://localhost:3000`)
- **Supabase API**: 54321 (`http://localhost:54321`)
- **Supabase DB**: 54322
- **Supabase Studio**: 54323

### 🚀 起動コマンド
```bash
# Supabase起動
npx supabase start

# フロントエンド開発サーバー
cd frontend && npm run dev
```

---

## 📈 #file:plan.md との差分

### ✅ 実装済み機能
- ✅ デュアルターンシステム（DBスキーマ完了）
- ✅ Supabase Realtime統合
- ✅ TypeScript型安全性
- ✅ IT用語辞書システム
- ✅ ゲームセッション管理

### 🔄 plan.mdとの主な差分
1. **バックエンドAPI不要**: plan.mdではAPI別途言及、実際はSupabase一体型
2. **マッチング実装済み**: ルーム・プレイヤー管理システム実装完了
3. **日本語サポート強化**: wanakana統合で日本語入力対応
4. **インフラ自動化**: Terraform + Vercel自動デプロイ

---

## 🎯 次のアクション候補

### 🚀 実装フェーズ
1. **ゲームロジック実装** - ターン生成・判定システム
2. **リアルタイム同期** - プレイヤー状態同期
3. **UI/UXコンポーネント** - ゲーム画面構築
4. **スコアシステム** - 得点計算・コンボ機能
5. **テスト・最適化** - パフォーマンス調整

### 📚 調査・設計
- ゲームフロー詳細設計
- リアルタイム同期戦略
- パフォーマンス最適化戦略

---

## 📝 まとめ

現在の技術構成は **plan.md よりも進化・最適化** されており、特に：

🔥 **強み**:
- 最新のNext.js 15 + React 19の安定性
- Supabase Realtimeによる高性能リアルタイム通信
- 完全TypeScript化による型安全性
- デュアルターンシステムの基盤完成
- Terraform自動化によるインフラ安定性

🎯 **次のステップ**: 
基盤は整っているため、ゲームロジック実装とUI構築に集中可能な状態 🚀
