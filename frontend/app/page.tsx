'use client';

import { useState, useEffect } from 'react';
import { useSocket, useMessages, useUser, useServerConfig, useOnlineUsers, useSocketNotifications } from '../hooks/use-socket';

export default function Home() {
  const [inputMessage, setInputMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [tempServerUrl, setTempServerUrl] = useState('');
  
  // Socket管理フック
  const { connectionStatus, connectionStatusText, connect, disconnect, isConnected, isConnecting, hasError } = useSocket();
  
  // メッセージ管理フック
  const { messages, send, clear } = useMessages();
  
  // ユーザー管理フック
  const { user, login, logout, isLoggedIn } = useUser();
  
  // サーバー設定フック
  const { serverUrl, updateServerUrl } = useServerConfig();
  
  // オンラインユーザー管理フック
  const { onlineUsers, onlineUserCount } = useOnlineUsers();
  
  // Socket通知フック
  useSocketNotifications();
  
  // 初期化時にサーバーURLをセット
  useEffect(() => {
    setTempServerUrl(serverUrl);
  }, [serverUrl]);
  
  // ログイン処理
  const handleLogin = () => {
    if (userName.trim()) {
      login({
        id: Date.now().toString(),
        name: userName.trim()
      });
    }
  };
  
  // メッセージ送信処理
  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      const success = send(inputMessage.trim());
      if (success) {
        setInputMessage('');
      }
    }
  };
  
  // サーバーURL更新処理
  const handleUpdateServerUrl = () => {
    if (tempServerUrl.trim()) {
      updateServerUrl(tempServerUrl.trim());
    }
  };
  
  // Enterキーでメッセージ送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Socket管理 with Jotai
      </h1>
      
      {/* ユーザーログイン */}
      {!isLoggedIn ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">ユーザーログイン</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="ユーザー名を入力"
              className="flex-1 p-2 border border-gray-300 rounded"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button 
              onClick={handleLogin}
              disabled={!userName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            >
              ログイン
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">ようこそ、{user?.name}さん！</h2>
              <p className="text-gray-600">ID: {user?.id}</p>
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
      
      {/* サーバー設定 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">サーバー設定</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tempServerUrl}
            onChange={(e) => setTempServerUrl(e.target.value)}
            placeholder="サーバーURL (例: http://localhost:3001)"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button 
            onClick={handleUpdateServerUrl}
            disabled={!tempServerUrl.trim() || isConnected}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
          >
            更新
          </button>
        </div>
        <p className="text-sm text-gray-600">現在のURL: {serverUrl}</p>
      </div>
      
      {/* 接続状態 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">接続状態</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 
            isConnecting ? 'bg-yellow-500' : 
            hasError ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
          <span className="font-medium">{connectionStatusText}</span>
          <span className="text-sm text-gray-600">({connectionStatus})</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={connect}
            disabled={!isLoggedIn || isConnected || isConnecting}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            接続
          </button>
          <button 
            onClick={disconnect}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
          >
            切断
          </button>
        </div>
      </div>
      
      {/* オンラインユーザー */}
      {isConnected && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            オンラインユーザー ({onlineUserCount}人)
          </h2>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((onlineUser) => (
              <div key={onlineUser.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {onlineUser.name}
              </div>
            ))}
          </div>
          {onlineUserCount === 0 && (
            <p className="text-gray-500">現在オンラインユーザーはいません</p>
          )}
        </div>
      )}
      
      {/* メッセージ送信 */}
      {isConnected && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">メッセージ送信</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            >
              送信
            </button>
          </div>
        </div>
      )}
      
      {/* メッセージ履歴 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">メッセージ履歴 ({messages.length}件)</h2>
          <button 
            onClick={clear}
            disabled={messages.length === 0}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            クリア
          </button>
        </div>
        
        <div className="h-64 overflow-y-auto border border-gray-200 rounded p-4 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">メッセージはありません</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="p-2 bg-white rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="flex-1">{msg.content}</p>
                    <div className="text-xs text-gray-500 ml-2">
                      <div>{msg.userId || '匿名'}</div>
                      <div>{msg.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
