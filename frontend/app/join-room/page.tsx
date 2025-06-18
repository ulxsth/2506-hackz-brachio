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
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🚪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ルームに参加</h1>
          <p className="text-gray-600">あいことばを入力してルームに参加します</p>
          {user?.name && (
            <p className="text-sm text-gray-500 mt-2">
              ニックネーム: <span className="font-medium text-gray-700">{user.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
              あいことば <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="ルームのあいことばを入力"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {(error || globalError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <p className="text-red-700 font-medium">参加できませんでした</p>
                <p className="text-red-600 text-sm">{error || globalError}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">参加のヒント</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• ホストからあいことばを教えてもらいましょう</p>
              <p>• 大文字・小文字は区別されます</p>
              <p>• ルームが満員の場合は参加できません</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  参加中...
                </>
              ) : (
                '参加する'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ルームを作成したい場合は「戻る」→「ルームを作る」を選択してください
          </p>
        </div>
      </div>
    </div>
  );
}
