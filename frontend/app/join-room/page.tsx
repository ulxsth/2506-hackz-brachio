"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { Button, Input, Card } from '@/components/ui';

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
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <Card className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚪</span>
            <h1 className="text-xl font-bold">ルーム参加</h1>
          </div>
          <p className="text-green-300 text-sm">
            ルームコードを入力してゲームセッションに参加
          </p>
          {user?.name && (
            <p className="text-blue-400 text-sm mt-2">
              ユーザー: <span className="text-cyan-400">{user.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm mb-2">
              ルームコード <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="ルームコードを入力..."
              disabled={isLoading}
              required
            />
          </div>

          {(error || globalError) && (
            <div className="bg-red-900/20 border border-red-500 rounded p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <div>
                  <p className="text-red-400 font-semibold text-sm">参加に失敗しました</p>
                  <p className="text-red-300 text-sm">{error || globalError}</p>
                </div>
              </div>
            </div>
          )}

          <Card className="bg-gray-900/50">
            <h3 className="text-yellow-400 font-semibold mb-2">💡 ヒント</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>• ホストからルームコードを教えてもらいましょう</p>
              <p>• 大文字・小文字は区別されます</p>
              <p>• ルームが満員の場合は参加できません</p>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1"
            >
              戻る
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  参加中...
                </>
              ) : (
                '参加'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            ルームを作成したい場合は「戻る」→「ルーム作成」を選択してください
          </p>
        </div>
      </Card>
    </div>
  );
}
