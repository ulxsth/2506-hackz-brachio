"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';

export default function RoomPage() {
  const {
    currentRoom,
    players,
    user,
    connectionState,
    error: globalError,
    startGame,
    leaveRoom,
    clearError
  } = useRoom();
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // ルーム情報がない場合はメニューに戻る
    if (!currentRoom || !user) {
      router.push('/menu');
      return;
    }

    // ゲームが開始された場合はゲーム画面に移動
    if (currentRoom.status === 'playing') {
      router.push('/game');
    }
  }, [currentRoom, user, router]);

  const handleStartGame = async () => {
    setError('');
    
    if (players.length < 2) {
      setError('2人以上で開始できます');
      return;
    }

    const result = await startGame();
    if (!result.success) {
      setError(result.error || 'ゲーム開始に失敗しました');
    }
  };

  const handleLeaveRoom = async () => {
    if (confirm('ルームを退出しますか？')) {
      await leaveRoom();
      router.push('/menu');
    }
  };

  if (!currentRoom) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  const isHost = user && currentRoom.host_id === user.id;
  const canStartGame = isHost && players.length >= 2;
  const settings = currentRoom.settings as { timeLimit: number; maxPlayers: number; category: string };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ルーム待機中</h1>
          <p className="text-gray-600">参加者を待っています...</p>
          {connectionState === 'connecting' && (
            <p className="text-sm text-blue-600">Supabase接続中...</p>
          )}
        </div>

        {(error || globalError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error || globalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* ルーム情報 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ルーム情報</h2>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <span className="text-gray-600">あいことば:</span>
              <span className="ml-2 font-mono bg-white px-2 py-1 rounded font-bold text-indigo-600">
                {currentRoom.id}
              </span>
            </div>
            <div>
              <span className="text-gray-600">制限時間:</span>
              <span className="ml-2 font-semibold">{settings.timeLimit}分</span>
            </div>
            <div>
              <span className="text-gray-600">参加者数:</span>
              <span className="ml-2 font-semibold">{players.length}/{settings.maxPlayers}人</span>
            </div>
          </div>
        </div>

        {/* 参加者一覧 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">参加者一覧</h2>
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">{player.name}</span>
                    {player.is_host && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        👑 ホスト
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="ml-2 text-sm text-green-600">オンライン</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ゲーム開始の説明 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">ゲームルール</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• 制約条件に沿ったIT用語をタイピングして得点を競います</p>
            <p>• 正解すると得点獲得、連続正解でコンボボーナス</p>
            <p>• パス機能で制約を変更可能（10秒クールダウン）</p>
            <p>• 制限時間内により多くの得点を獲得した人の勝利！</p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-3">
          <button
            onClick={handleLeaveRoom}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            ルームを出る
          </button>
          
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className={`flex-2 font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform ${
                canStartGame
                  ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canStartGame ? 'ゲーム開始！' : `あと${2 - players.length}人待機中`}
            </button>
          ) : (
            <div className="flex-2 bg-yellow-100 text-yellow-800 font-semibold py-3 px-8 rounded-lg text-center">
              ホストの開始を待機中...
            </div>
          )}
        </div>

        {/* リアルタイム更新の表示 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            参加者の入退室はリアルタイムで更新されます
          </p>
        </div>
      </div>
    </div>
  );
}
