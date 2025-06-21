"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { Button, Card } from '@/components/ui';

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
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <Card>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading room...</span>
          </div>
        </Card>
      </div>
    );
  }

  const isHost = user && currentRoom.host_id === user.id;
  const canStartGame = isHost && players.length >= 2;
  const settings = currentRoom.settings as { timeLimit: number; maxPlayers: number };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🎮</span>
            <h1 className="text-2xl font-bold">ルーム待機</h1>
          </div>
          <p className="text-green-300">プレイヤー待機中...</p>
          {connectionState === 'connecting' && (
            <p className="text-yellow-400 text-sm mt-1">Supabaseに接続中...</p>
          )}
        </div>

        {(error || globalError) && (
          <Card className="bg-red-900/20 border-red-500">
            <div className="flex items-start gap-2">
              <span className="text-red-400">⚠️</span>
              <div>
                <p className="text-red-400 font-semibold">エラー</p>
                <p className="text-red-300 text-sm">{error || globalError}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Room Information */}
        <Card>
          <h2 className="text-lg font-bold text-cyan-400 mb-3">📝 ルーム情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">ルームコード:</span>
              <span className="text-yellow-400 font-mono font-bold">
                {currentRoom.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">制限時間:</span>
              <span className="text-blue-400">{settings.timeLimit} 分</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">プレイヤー:</span>
              <span className="text-green-400">{players.length}/{settings.maxPlayers} 人</span>
            </div>
          </div>
        </Card>

        {/* Players List */}
        <Card>
          <h2 className="text-lg font-bold text-cyan-400 mb-3">👥 プレイヤー ({players.length} 人)</h2>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-300">{player.name}</span>
                    {currentRoom.host_id === player.id && (
                      <span className="text-yellow-400 text-xs bg-yellow-900/30 px-2 py-1 rounded">
                        👑 ホスト
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">オンライン</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Game Rules */}
        <Card>
          <h3 className="text-lg font-bold text-yellow-400 mb-3">📋 ゲームルール</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• 制約条件に沿ったIT用語をタイピングして得点を競います</p>
            <p>• 正解すると得点獲得、連続正解でコンボボーナス</p>
            <p>• パス機能で制約を変更可能（10秒クールダウン）</p>
            <p>• 制限時間内により多くの得点を獲得した人の勝利！</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleLeaveRoom}
            className="flex-1"
          >
            退室
          </Button>

          {isHost ? (
            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className="flex-2"
            >
              {canStartGame ? '🚀 ゲーム開始！' : `⏳ あと ${2 - players.length} 人待機中`}
            </Button>
          ) : (
            <div className="flex-2 flex items-center justify-center bg-gray-900/50 border border-gray-700 rounded px-4 py-2">
              <span className="text-yellow-400 text-sm">⏳ ホストの開始を待機中...</span>
            </div>
          )}
        </div>

        {/* Real-time Update Notice */}
        <div className="text-center">
          <p className="text-gray-500 text-xs">
            💡 参加者の入退室はリアルタイムで更新されます
          </p>
        </div>
      </div>
    </div>
  );
}
