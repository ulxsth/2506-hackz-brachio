"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';

export default function CreateRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [category, setCategory] = useState('all');
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
          maxPlayers,
          category
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
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🏗️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ルームを作成</h1>
          <p className="text-gray-600">新しいゲームルームを作成します</p>
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
              placeholder="例: hoge123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              maxLength={30}
              required
            />
            <p className="text-xs text-gray-500 mt-1">参加者がルームに入るためのパスワードです（1-30文字）</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
                制限時間（分）
              </label>
              <select
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              >
                <option value={3}>3分</option>
                <option value={5}>5分</option>
                <option value={10}>10分</option>
                <option value={15}>15分</option>
              </select>
            </div>

            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                最大人数
              </label>
              <input
                type="number"
                id="maxPlayers"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                min="2"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="2-100人"
              />
              <p className="text-xs text-gray-500 mt-1">2人以上100人以下で設定してください</p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー設定
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              >
                <option value="all">全分野</option>
                <option value="web">Web開発</option>
                <option value="database">データベース</option>
                <option value="ai">AI・機械学習</option>
                <option value="security">セキュリティ</option>
                <option value="infrastructure">インフラ・クラウド</option>
                <option value="programming">プログラミング言語</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">設定内容</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• あいことば: <span className="font-mono bg-white px-2 py-1 rounded">{roomCode || '未設定'}</span></p>
              <p>• 制限時間: {timeLimit}分</p>
              <p>• 最大人数: {maxPlayers}人</p>
              <p>• カテゴリー: {
                category === 'all' ? '全分野' :
                category === 'web' ? 'Web開発' :
                category === 'database' ? 'データベース' :
                category === 'ai' ? 'AI・機械学習' :
                category === 'security' ? 'セキュリティ' :
                category === 'infrastructure' ? 'インフラ・クラウド' :
                category === 'programming' ? 'プログラミング言語' : '全分野'
              }</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isCreating}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  作成中...
                </div>
              ) : (
                'ルーム作成'
              )}
            </button>
          </div>

          {connectionState === 'connecting' && (
            <div className="text-center text-sm text-gray-600">
              Supabaseに接続中...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
