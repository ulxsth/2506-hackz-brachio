"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';

export default function CreateRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const {
    createRoom,
    connectionState,
    error: globalError,
    clearError
  } = useRoom();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError(); // グローバルエラーもクリア
    
    if (!roomCode.trim()) {
      setError('あいことばを入力してください');
      return;
    }

    if (roomCode.length < 1 || roomCode.length > 30) {
      setError('あいことばは1文字以上30文字以下で入力してください');
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 100) {
      setError('最大人数は2人以上100人以下で設定してください');
      return;
    }

    setIsCreating(true);

    try {
      const result = await createRoom({
        roomId: roomCode,
        settings: {
          timeLimit,
          maxPlayers
        }
      });

      if (result.success) {
        router.push('/room');
      } else {
        setError(result.error || 'ルーム作成に失敗しました');
      }
    } catch (error) {
      console.error('Room creation error:', error);
      setError('ルーム作成中にエラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.push('/menu');
  };

  return (
    <div>
      <div>
        <div>
          <div>
            <span>🏗️</span>
          </div>
          <h1>ルームを作成</h1>
          <p>新しいゲームルームを作成します</p>
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

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="roomCode">
              あいことば <span>*</span>
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="例: hoge123"
              maxLength={30}
              required
            />
            <p>参加者がルームに入るためのパスワードです（1-30文字）</p>
          </div>

          <div>
            <div>
              <label htmlFor="timeLimit">
                制限時間（分）
              </label>
              <select
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              >
                <option value={3}>3分</option>
                <option value={5}>5分</option>
                <option value={10}>10分</option>
                <option value={15}>15分</option>
              </select>
            </div>

            <div>
              <label htmlFor="maxPlayers">
                最大人数
              </label>
              <input
                type="number"
                id="maxPlayers"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                min="2"
                max="100"
                placeholder="2-100人"
              />
              <p>2人以上100人以下で設定してください</p>
            </div>
          </div>

          <div>
            <h3>設定内容</h3>
            <div>
              <p>• あいことば: <span>{roomCode || '未設定'}</span></p>
              <p>• 制限時間: {timeLimit}分</p>
              <p>• 最大人数: {maxPlayers}人</p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleBack}
              disabled={isCreating}
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? (
                <div>
                  <div></div>
                  作成中...
                </div>
              ) : (
                'ルーム作成'
              )}
            </button>
          </div>

          {connectionState === 'connecting' && (
            <div>
              Supabaseに接続中...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
