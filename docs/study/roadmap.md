# 開発手順書
## 技術キャッチアップ＆開発プラン

### 前提
- **既知技術**: React, TypeScript
- **新規技術**: Next.js, Hono, Socket.io, PostgreSQL, Redis, Docker, AWS, Terraform

---

## 技術キャッチアップ（1-2週間）

### ✅1.1 Next.js 学習（2-3日）
#### 目標
- App Routerの理解
- CSRの実装方法
- 基本的なプロジェクト構成

#### 学習手順
```bash
# 1. Next.js公式チュートリアル
npx create-next-app@latest my-app --typescript --app
cd my-app
npm run dev

# 2. 実践内容
# - App Router の基本
# - 'use client' の使い方
# - dynamic import
# - 環境変数の設定
```

#### 参考リソース
- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [App Router Tutorial](https://nextjs.org/learn)

#### 成果物
- 簡単なNext.jsアプリ（CSR）の作成
- ルーティングの理解

### 1.2 Hono + Socket.io 学習（3-4日）
#### 目標
- Honoの基本的なAPI作成
- Socket.ioによるリアルタイム通信
- TypeScriptでのサーバーサイド開発

#### 学習手順
```bash
# 1. Hono プロジェクトセットアップ
mkdir hono-practice
cd hono-practice
npm init -y
npm install hono @hono/node-server
npm install -D typescript @types/node tsx

# 2. Socket.io 追加
npm install socket.io
npm install -D @types/socket.io

# 3. 実践内容
# - 基本的なREST API
# - Socket.ioサーバーの作成
# - リアルタイム通信の実装
```

#### サンプルコード学習
```typescript
// server.ts (Hono + Socket.io)
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Server } from 'socket.io'

const app = new Hono()

// REST API
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' })
})

// Socket.io
const server = serve({ fetch: app.fetch })
const io = new Server(server)

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました')
  
  socket.on('message', (data) => {
    io.emit('message', data) // 全員に送信
  })
})
```

#### 参考リソース
- [Hono 公式ドキュメント](https://hono.dev/)
- [Socket.io チュートリアル](https://socket.io/get-started/chat)

#### 成果物
- 簡単なチャットアプリの作成
- HonoとSocket.ioの基本理解

### 1.3 データベース学習（2-3日）
#### 目標
- PostgreSQLの基本操作
- Redisの基本操作
- Docker Composeでの環境構築

#### 学習手順
```bash
# 1. Docker環境セットアップ
mkdir db-practice
cd db-practice

# docker-compose.yml 作成
# PostgreSQL + Redis + Adminer の環境
```

#### Docker Compose サンプル
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: practice_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  adminer:
    image: adminer
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

#### 実践内容
```sql
-- PostgreSQL 基本操作
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name) VALUES ('テストユーザー');
SELECT * FROM users;
```

```bash
# Redis 基本操作
redis-cli
SET key "value"
GET key
HSET user:1 name "Alice" score 100
HGET user:1 name
```

#### 参考リソース
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Redis Tutorial](https://redis.io/docs/tutorial/)
- [Docker Compose Tutorial](https://docs.docker.com/compose/gettingstarted/)

#### 成果物
- Docker環境でのDB操作経験
- 基本的なSQL・Redisコマンドの理解
