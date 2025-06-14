*# 開発手順書
## 技術キャッチアップ＆開発プラン

### 前提
- **既知技術**: React, TypeScript
- **新規技術**: Next.js, Express, Socket.io, PostgreSQL, Redis, Docker, AWS, Terraform

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

### 1.2 Express + Socket.io 学習（3-4日）
#### 目標
- Expressの基本的なAPI作成
- Socket.ioによるリアルタイム通信
- TypeScriptでのサーバーサイド開発

#### 学習手順
```bash
# 1. Express プロジェクトセットアップ
mkdir express-practice
cd express-practice
npm init -y
npm install express socket.io cors
npm install -D typescript @types/node @types/express @types/socket.io ts-node nodemon

# 2. TypeScript設定
npx tsc --init

# 3. 実践内容
# - 基本的なREST API
# - Socket.ioサーバーの作成
# - リアルタイム通信の実装
# - CORSの設定
```

#### サンプルコード学習
```typescript
// server.ts (Express + Socket.io)
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Socket.io
io.on('connection', (socket) => {
  console.log('ユーザーが接続しました')
  
  socket.on('message', (data) => {
    io.emit('message', data) // 全員に送信
  })
})

server.listen(3001, () => {
  console.log('Server running on port 3001')
})
```

#### 参考リソース
- [Express 公式ドキュメント](https://expressjs.com/)
- [Socket.io チュートリアル](https://socket.io/get-started/chat)

#### 成果物
- 簡単なチャットアプリの作成
- ExpressとSocket.ioの基本理解

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
*