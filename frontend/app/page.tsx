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
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem' }}>
        TYPE 2 LIVE
      </h1>
      
      <div style={{ 
        maxWidth: '400px', 
        margin: '0 auto', 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>接続状態</h2>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500',
            backgroundColor: connected ? '#dcfce7' : '#fee2e2',
            color: connected ? '#166534' : '#991b1b'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              marginRight: '8px',
              backgroundColor: connected ? '#22c55e' : '#ef4444'
            }}></div>
            {connected ? '接続中' : '切断中'}
          </div>
        </div>

        {message && (
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>サーバーメッセージ</h3>
            <p style={{ 
              color: '#6b7280', 
              backgroundColor: '#f9fafb', 
              padding: '0.75rem', 
              borderRadius: '4px' 
            }}>
              {message}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            style={{
              width: '100%',
              backgroundColor: connected ? '#3b82f6' : '#9ca3af',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: connected ? 'pointer' : 'not-allowed'
            }}
            disabled={!connected}
          >
            ルーム作成
          </button>
          
          <button 
            style={{
              width: '100%',
              backgroundColor: connected ? '#10b981' : '#9ca3af',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: connected ? 'pointer' : 'not-allowed'
            }}
            disabled={!connected}
          >
            ルーム参加
          </button>
        </div>
      </div>
    </main>
  );
}
