"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom } from '@/lib/supabase-atoms';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useAtom(userAtom);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!nickname.trim()) {
      setError('ニックネームを入力してください');
      return;
    }
    if (nickname.length > 15) {
      setError('ニックネームは15文字以内で入力してください');
      return;
    }
    if (nickname.length < 1) {
      setError('ニックネームは1文字以上で入力してください');
      return;
    }

    // userAtomにニックネームを設定
    setUser({ id: crypto.randomUUID(), name: nickname });
    router.push('/menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">TYPE 2 LIVE</h1>
          <p className="text-gray-600">ITタイピングゲーム</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">ゲームについて</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-3">
            <div>
              <p className="font-medium mb-2">• 制約条件に沿ったIT用語をタイピング</p>
              <p className="font-medium mb-2">• リアルタイムマルチプレイヤー対戦</p>
              <p className="font-medium mb-2">• コンボで高得点を狙おう！</p>
              <p className="font-medium mb-2">• 最大100人まで同時プレイ可能</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-medium text-gray-800 mb-2">IT用語カテゴリー:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span>• Web開発 (HTML, CSS, React等)</span>
                <span>• データベース (SQL, MongoDB等)</span>
                <span>• AI・機械学習 (Python, TensorFlow等)</span>
                <span>• セキュリティ (SSL, OAuth等)</span>
                <span>• インフラ (AWS, Docker等)</span>
                <span>• プログラミング言語 (Java, C++等)</span>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="font-medium text-gray-800 mb-1">得点計算式:</p>
              <p className="text-xs bg-white p-2 rounded font-mono">
                得点 = 単語文字数 × 難易度 × 制約係数 × コンボ数
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネームを入力してください"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              maxLength={15}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>1-15文字</span>
              <span>{nickname.length}/15</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            入場
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-blue-600 hover:underline">
            利用規約
          </a>
        </div>
      </div>
    </div>
  );
}
