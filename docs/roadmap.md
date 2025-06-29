# 全体開発ロードマップ
## TYPE 2 LIVE - ハッカソン向け開発計画

### 📅 スケジュール概要
- **開発開始**: 2025年6月11日（水）
- **ハッカソン**: 2025年6月21日（土）～6月22日（日）
- **締切**: 2025年6月22日（日）
- **総開発期間**: 12日間

---

## 🎯 マイルストーン

| 期間 | フェーズ | 主要成果物 | 完了目標日 |
|------|---------|------------|------------|
| 6/11-6/13 | 技術キャッチアップ | 基礎技術の習得 | 6/13 |
| 6/14-6/17 | 基盤開発 | 基本機能実装 | 6/17 |
| 6/18-6/20 | 機能開発 | ゲーム機能実装 | 6/20 |
| 6/21-6/22 | ハッカソン | 完成・発表 | 6/22 |

---

## 📋 詳細スケジュール

### Week 1: 基礎固め（6/11-6/13）

#### 6/11（水）- Day 1
**技術キャッチアップ開始**
- [ ] **AM**: プロジェクト環境構築
  - Git リポジトリ整備
  - 開発環境セットアップ
- [ ] **PM**: Next.js 学習開始
  - Next.js 14 + App Router チュートリアル
  - CSR実装の基礎理解

**成果物**: 
- 開発環境構築完了
- Next.js基礎サンプル作成

#### 6/12（木）- Day 2
**バックエンド技術習得**
- [ ] **AM**: Hono学習
  - 基本的なAPI作成
  - TypeScript環境構築
- [ ] **PM**: Socket.io学習
  - リアルタイム通信の基礎
  - 簡単なチャットアプリ作成

**成果物**: 
- Hono + Socket.io基礎サンプル
- フロント・バック間通信確認

#### 6/13（金）- Day 3
**データベース・Docker学習**
- [ ] **AM**: Docker環境構築
  - PostgreSQL + Redis環境
  - Docker Compose設定
- [ ] **PM**: データベース基礎操作
  - SQL基本操作
  - Redis操作練習

**成果物**: 
- Docker開発環境完成
- DB操作の基礎習得

---

### Week 2 前半: 基盤開発（6/14-6/17）

#### 6/14（土）- Day 4
**プロジェクト基盤構築**
- [ ] **AM**: Monorepo構成作成
  - frontend/backend フォルダ構成
  - 共通設定ファイル整備
- [ ] **PM**: 基本API実装開始
  - ヘルスチェックAPI
  - 基本認証機能（簡易版）

**成果物**: 
- プロジェクト構成完成
- 基本API動作確認

#### 6/15（日）- Day 5
**Socket.io基盤実装**
- [ ] **AM**: Socket.io サーバー実装
  - 接続・認証ロジック
  - 基本イベントハンドラー
- [ ] **PM**: フロントエンド接続実装
  - Socket.io クライアント
  - 接続状態管理

**成果物**: 
- リアルタイム通信基盤完成
- フロント・バック接続確認

#### 6/16（月）- Day 6 
**MCP Server導入 + ルーム機能実装**
- [ ] **AM**: MCP Server環境構築
  - GitHub Actions MCP Server導入
  - AWS MCP Server導入
  - 開発支援ワークフロー構築
- [ ] **PM**: ルーム管理API実装
  - ルーム作成・参加API
  - Redis状態管理
  - CI/CD パイプライン設定

**成果物**: 
- MCP Server運用開始
- ルーム基本機能完成
- 自動化ワークフロー構築

#### 6/17（火）- Day 7
**フロントエンド実装 + 辞書機能**
- [ ] **AM**: ルーム画面実装
  - ルーム作成画面
  - ルーム参加画面
  - Socket.io クライアント統合
- [ ] **PM**: 辞書機能実装
  - データベース設計実装
  - テーブル作成
  - 辞書検索API
  - AWS RDS設定（MCP経由）

**成果物**: 
- ルーム画面完成
- 辞書機能基盤完成
- AWS環境構築

---

### Week 2 後半: 機能開発（6/18-6/20）

#### 6/18（水）- Day 8
**ゲーム進行機能 + CI/CD強化**
- [ ] **AM**: ゲーム開始・終了ロジック
  - タイマー機能
  - ゲーム状態管理
- [ ] **PM**: スコア計算機能 + デプロイ自動化
  - 得点計算ロジック
  - リアルタイムスコア更新
  - GitHub Actions デプロイワークフロー（MCP経由）

**成果物**: 
- ゲーム進行システム
- 自動デプロイパイプライン

#### 6/19（木）- Day 9
**タイピング機能実装 + AWS本格運用**
- [ ] **AM**: 入力判定ロジック
  - 辞書照合機能
  - リアルタイム判定
- [ ] **PM**: UI実装 + 本番環境構築
  - タイピング画面
  - 視覚的フィードバック
  - AWS本番環境デプロイ（MCP経由）

**成果物**: 
- タイピング機能完成
- 本番環境運用開始

#### 6/20（金）- Day 10
**制約・コンボシステム + 監視体制**
- [ ] **AM**: 制約システム実装
  - 制約パターン適用
  - パス機能
- [ ] **PM**: コンボシステム + 運用監視
  - コンボ計算
  - UI表示
  - AWS CloudWatch設定（MCP経由）
  - アラート設定

**成果物**: 
- 制約システム完成
- 運用監視体制構築

---

### ハッカソン: 完成・発表（6/21-6/22）

#### 6/21（土）- Day 11 【ハッカソン1日目】
**統合・ポリッシュ**
- [ ] **AM**: 機能統合・テスト
  - エンドツーエンドテスト
  - バグ修正
- [ ] **PM**: UI/UX改善
  - デザイン調整
  - アニメーション追加

**成果物**: 
- 動作する完全なゲーム
- UI/UX改善

#### 6/22（日）- Day 12 【ハッカソン2日目・締切】
**最終調整・発表準備**
- [ ] **AM**: 最終バグ修正
  - 動作確認
  - パフォーマンス調整
- [ ] **PM**: 発表準備
  - デモ動画作成
  - プレゼン資料作成

**成果物**: 
- 完成したTYPE 2 LIVE
- 発表資料・デモ

---

## 🤖 MCP Server統合（開発支援強化）

### MCP Server導入による自動化
- **GitHub Actions MCP**: PR作成、Issue管理、ワークフロー実行
- **AWS MCP**: インフラ構築、デプロイ、リソース管理
- **開発効率化**: 手動作業の削減、エラー防止

### 導入手順（6/16実施）
```bash
# MCP Server環境構築
npm install -g @modelcontextprotocol/cli
npm install @modelcontextprotocol/github-actions
npm install @modelcontextprotocol/aws

# 設定ファイル作成
# ~/.config/mcp/config.json
```

### MCP Server設定例
```json
{
  "servers": {
    "github-actions": {
      "command": "npx",
      "args": ["@modelcontextprotocol/github-actions"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_REPO": "2506-hackz-brachio"
      }
    },
    "aws": {
      "command": "npx",
      "args": ["@modelcontextprotocol/aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
        "AWS_REGION": "ap-northeast-1"
      }
    }
  }
}
```

### 自動化対象
1. **GitHub Actions ワークフロー**
   - テスト実行
   - ビルド・デプロイ
   - セキュリティスキャン

2. **AWS リソース管理**
   - ECS/Fargate デプロイ
   - RDS設定
   - ElastiCache設定

---

## 🚨 リスク管理

### 高リスク項目
1. **Socket.io学習の遅れ** 
   - 対策: 6/12中に基本理解必須
   - バックアッププラン: シンプルなポーリング方式

2. **MCP Server統合の複雑さ**
   - 対策: 6/16中に基本動作確認必須
   - バックアッププラン: 手動デプロイに切り替え

3. **データベース統合の複雑さ**
   - 対策: 6/17までに基本動作確認
   - バックアッププラン: メモリ内データ管理

4. **AWS環境構築の遅れ**
   - 対策: MCP経由での自動化活用
   - バックアッププラン: ローカル環境での完成

5. **リアルタイム同期の難しさ**
   - 対策: 早期プロトタイプ作成
   - バックアッププラン: 疑似リアルタイム

### 中リスク項目
1. **UI実装の時間不足**
   - 対策: 最小限のUI設計
   - バックアッププラン: 既存UIライブラリ活用

2. **制約システムの複雑さ**
   - 対策: 基本制約のみ実装
   - バックアッププラン: 固定制約パターン

---

## 🎯 MVP（最小実行可能製品）定義

### 必須機能（Must Have）
- [ ] ルーム作成・参加
- [ ] マルチプレイヤー対応
- [ ] IT用語タイピング
- [ ] リアルタイムスコア表示
- [ ] 基本的な制約（1-2種類）

### 重要機能（Should Have）
- [ ] コンボシステム
- [ ] 複数制約パターン
- [ ] ゲーム結果画面
- [ ] パス機能

### あれば良い機能（Could Have）
- [ ] アニメーション効果
- [ ] サウンド効果
- [ ] 詳細統計
- [ ] ランキング機能

---

## 📊 進捗管理

### 日次チェックポイント
- **毎日21:00**: 進捗確認・翌日計画
- **技術的詰まり**: 2時間ルール（2時間悩んだら方針転換）
- **スコープ調整**: 遅れが生じた場合の機能削減判断

### 緊急時プラン
1. **6/16時点で遅れ**: MCP導入スキップ、手動運用に切り替え
2. **6/17時点で遅れ**: AWS環境簡素化、ローカル開発継続
3. **6/19時点で遅れ**: UI機能最小化、コア機能に集中

### 成功基準
- **技術的成功**: 4人同時プレイが安定動作
- **機能的成功**: タイピングゲームとして成立
- **体験的成功**: 楽しいゲーム体験の提供
- **運用的成功**: 自動化されたデプロイ・監視体制

---

## 🛠 開発支援リソース

### 毎日の学習リソース
- **6/11-6/13**: 公式ドキュメント中心
- **6/14-6/17**: 実装重視・サンプルコード活用
- **6/18-6/20**: Stack Overflow・GitHub Issues
- **6/21-6/22**: チーム内知識共有

### 緊急時サポート
- Discord/Slack でのリアルタイム相談
- コードレビュー・ペアプログラミング
- 技術的詰まりポイントの共有

### 🤖 MCP Server活用による開発効率化
- **自動化対象**: GitHub Actions、AWS リソース管理
- **効果**: 手動作業削減、エラー防止、デプロイ時間短縮
- **導入日**: 6/16（本日実施）
