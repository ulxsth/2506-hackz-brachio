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
            <h1 className="text-xl font-bold">join-room</h1>
          </div>
          <p className="text-green-300 text-sm">
            Enter the room code to join a game session
          </p>
          {user?.name && (
            <p className="text-blue-400 text-sm mt-2">
              User: <span className="text-cyan-400">{user.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm mb-2">
              Room Code <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code..."
              disabled={isLoading}
              required
            />
          </div>

          {(error || globalError) && (
            <div className="bg-red-900/20 border border-red-500 rounded p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <div>
                  <p className="text-red-400 font-semibold text-sm">Failed to join</p>
                  <p className="text-red-300 text-sm">{error || globalError}</p>
                </div>
              </div>
            </div>
          )}

          <Card className="bg-gray-900/50">
            <h3 className="text-yellow-400 font-semibold mb-2">💡 Hints</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>• Get the room code from the host</p>
              <p>• Case sensitive</p>
              <p>• Cannot join if room is full</p>
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
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Want to create a room? Go back → "Create Room"
          </p>
        </div>
      </Card>
    </div>
  );
}
