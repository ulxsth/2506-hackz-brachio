"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    user,
    joinRoom,
    connectionState,
    error: globalError
  } = useRoom();
  const router = useRouter();

  useEffect(() => {
    // ユーザー情報の確認
    if (!user?.name) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!roomCode.trim()) {
      setError('あいことばを入力してください');
      setIsLoading(false);
      return;
    }

    try {
      if (!user?.name) {
        setError('ユーザー情報が見つかりません');
        setIsLoading(false);
        return;
      }

      const result = await joinRoom({
        roomId: roomCode,
        playerName: user.name
      });

      if (result.success) {
        router.push('/room');
      } else {
        setError(result.error || 'ルーム参加に失敗しました');
      }
    } catch (error) {
      setError('ルーム参加中にエラーが発生しました');
    } finally {
      setIsLoading(false);
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
            <span>🚪</span>
          </div>
          <h1>ルームに参加</h1>
          <p>あいことばを入力してルームに参加します</p>
          {user?.name && (
            <p>
              ニックネーム: <span>{user.name}</span>
            </p>
          )}
        </div>

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
              placeholder="ルームのあいことばを入力"
              disabled={isLoading}
              required
            />
          </div>

          {(error || globalError) && (
            <div>
              <span>⚠️</span>
              <div>
                <p>参加できませんでした</p>
                <p>{error || globalError}</p>
              </div>
            </div>
          )}

          <div>
            <h3>参加のヒント</h3>
            <div>
              <p>• ホストからあいことばを教えてもらいましょう</p>
              <p>• 大文字・小文字は区別されます</p>
              <p>• ルームが満員の場合は参加できません</p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div></div>
                  参加中...
                </>
              ) : (
                '参加する'
              )}
            </button>
          </div>
        </form>

        <div>
          <p>
            ルームを作成したい場合は「戻る」→「ルームを作る」を選択してください
          </p>
        </div>
      </div>
    </div>
  );
}
