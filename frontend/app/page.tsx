'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('welcome', (data) => {
      console.log('Welcome message:', data);
      setMessage(data.message);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <main>
      <h1>
        TYPE 2 LIVE
      </h1>
      
      <div>
        <div>
          <h2>接続状態</h2>
          <div>
            <div></div>
            {connected ? '接続中' : '切断中'}
          </div>
        </div>

        {message && (
          <div>
            <h3>サーバーメッセージ</h3>
            <p>
              {message}
            </p>
          </div>
        )}

        <div>
          <button 
            disabled={!connected}
          >
            ルーム作成
          </button>
          
          <button 
            disabled={!connected}
          >
            ルーム参加
          </button>
        </div>
      </div>
    </main>
  );
}
