"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  useEffect(() => {
    // ニックネームの取得
    const storedNickname = localStorage.getItem('nickname');
    if (!storedNickname) {
      router.push('/');
      return;
    }
    setNickname(storedNickname);
  }, [router]);

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    router.push('/join-room');
  };

  const handleChangeNickname = () => {
    localStorage.removeItem('nickname');
    router.push('/');
  };

  if (!nickname) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            こんにちは、{nickname}さん！
          </h1>
          <p className="text-gray-600">何をしますか？</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🏗️</span>
            <span>ルームを作る</span>
          </button>

          <button
            onClick={handleJoinRoom}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🚪</span>
            <span>ルームに参加する</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleChangeNickname}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ニックネームを変更
          </button>
        </div>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">ゲームの流れ</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. ルームを作成するか、既存のルームに参加</p>
            <p>2. 2人以上集まったらゲーム開始</p>
            <p>3. 制約に沿ったIT用語をタイピング</p>
            <p>4. 制限時間内により多くの得点を獲得しよう！</p>
          </div>
        </div>
      </div>
    </div>
  );
}
