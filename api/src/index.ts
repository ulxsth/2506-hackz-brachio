import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TYPE 2 LIVE API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
interface User {
  id: string;
  name: string;
  socketId: string;
}

const connectedUsers = new Map<string, User>();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Send welcome message
  socket.emit('welcome', { 
    message: 'Connected to TYPE 2 LIVE server',
    socketId: socket.id 
  });

  // Handle user login
  socket.on('user-login', (userData: { id: string; name: string }) => {
    const user: User = {
      ...userData,
      socketId: socket.id
    };
    
    connectedUsers.set(socket.id, user);
    console.log(`User logged in: ${user.name} (${socket.id})`);
    
    // ユーザー参加を他のユーザーに通知
    socket.broadcast.emit('user-joined', user);
    
    // 現在のオンラインユーザーリストを送信
    const usersList = Array.from(connectedUsers.values());
    io.emit('users-update', usersList);
  });

  // Handle message
  socket.on('message', (data: { id: string; content: string; timestamp: string; userId?: string }) => {
    console.log(`Message from ${socket.id}:`, data);
    
    // メッセージを全員に送信（送信者を含む）
    io.emit('message', {
      ...data,
      timestamp: new Date().toISOString() // サーバー側でタイムスタンプを設定
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      
      // ユーザー退出を他のユーザーに通知
      socket.broadcast.emit('user-left', user);
      
      // 更新されたオンラインユーザーリストを送信
      const usersList = Array.from(connectedUsers.values());
      io.emit('users-update', usersList);
    }
  });
  
  // ピング/ポン機能（接続状態確認）
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 TYPE 2 LIVE API Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;
