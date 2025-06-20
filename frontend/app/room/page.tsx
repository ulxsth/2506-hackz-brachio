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
    return <div>Loading...</div>;
  }

  const isHost = user && currentRoom.host_id === user.id;
  const canStartGame = isHost && players.length >= 2;
  const settings = currentRoom.settings as { timeLimit: number; maxPlayers: number };

  return (
    <div>
      <div>
        <div>
          <div>
            <span>🎮</span>
          </div>
          <h1>ルーム待機中</h1>
          <p>参加者を待っています...</p>
          {connectionState === 'connecting' && (
            <p>Supabase接続中...</p>
          )}
        </div>

        {(error || globalError) && (
          <div>
            <div>
              <div>
                <span>⚠️</span>
              </div>
              <div>
                <p>{error || globalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* ルーム情報 */}
        <div>
          <h2>ルーム情報</h2>
          <div>
            <div>
              <span>あいことば:</span>
              <span>
                {currentRoom.id}
              </span>
            </div>
            <div>
              <span>制限時間:</span>
              <span>{settings.timeLimit}分</span>
            </div>
            <div>
              <span>参加者数:</span>
              <span>{players.length}/{settings.maxPlayers}人</span>
            </div>
          </div>
        </div>

        {/* 参加者一覧 */}
        <div>
          <h2>参加者一覧</h2>
          <div>
            {players.map((player) => (
              <div
                key={player.id}
              >
                <div>
                  <div>
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <span>{player.name}</span>
                    {currentRoom.host_id === player.id && (
                      <span>
                        👑 ホスト
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div></div>
                  <span>オンライン</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ゲーム開始の説明 */}
        <div>
          <h3>ゲームルール</h3>
          <div>
            <p>• 制約条件に沿ったIT用語をタイピングして得点を競います</p>
            <p>• 正解すると得点獲得、連続正解でコンボボーナス</p>
            <p>• パス機能で制約を変更可能（10秒クールダウン）</p>
            <p>• 制限時間内により多くの得点を獲得した人の勝利！</p>
          </div>
        </div>

        {/* アクションボタン */}
        <div>
          <button
            onClick={handleLeaveRoom}
          >
            ルームを出る
          </button>
          
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
            >
              {canStartGame ? 'ゲーム開始！' : `あと${2 - players.length}人待機中`}
            </button>
          ) : (
            <div>
              ホストの開始を待機中...
            </div>
          )}
        </div>

        {/* リアルタイム更新の表示 */}
        <div>
          <p>
            参加者の入退室はリアルタイムで更新されます
          </p>
        </div>
      </div>
    </div>
  );
}
