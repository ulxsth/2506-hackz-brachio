"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom } from '@/lib/supabase-atoms';
import { debugLog } from '@/lib/logger';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useAtom(userAtom);
  const [error, setError] = useState('');
  const router = useRouter();

  // 初期状態を確認
  useEffect(() => {
    debugLog('HomePage - user:', user);
  }, []);

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
    const userData = { id: crypto.randomUUID(), name: nickname };
    debugLog('Setting user:', userData);
    setUser(userData);

    router.push('/menu');
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-terminalBg">
      <div className="bg-terminalBg text-terminalText font-mono rounded-lg shadow-lg border border-terminalBorder w-full max-w-2xl h-[90vh] flex flex-col p-4">
        {/* スクロール可能な履歴部分 */}
        <div className="flex-1 overflow-y-auto mb-2">
          <h1 className="text-2xl font-bold mb-2">TYPE 2 LIVE</h1>
          <p className="mb-4">ITタイピングゲーム</p>
          <div className="mb-4">
            <h2 className="font-semibold mb-1">ゲームについて</h2>
            <ul className="list-disc list-inside text-sm mb-2">
              <li>制約条件に沿ったIT用語をタイピング</li>
              <li>リアルタイムマルチプレイヤー対戦</li>
              <li>コンボで高得点を狙おう！</li>
              <li>最大100人まで同時プレイ可能</li>
            </ul>
            <div className="mb-2">
              <span className="font-semibold">IT用語カテゴリー:</span>
              <ul className="list-disc list-inside ml-4 text-xs">
                <li>Web開発 (HTML, CSS, React等)</li>
                <li>データベース (SQL, MongoDB等)</li>
                <li>AI・機械学習 (Python, TensorFlow等)</li>
                <li>セキュリティ (SSL, OAuth等)</li>
                <li>インフラ (AWS, Docker等)</li>
                <li>プログラミング言語 (Java, C++等)</li>
              </ul>
            </div>
            <div className="mb-2">
              <span className="font-semibold">得点計算式:</span>
              <span className="ml-2">得点 = 単語文字数 × 難易度 × 制約係数 × コンボ数</span>
            </div>
          </div>
        </div>
        {/* 入力欄 */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-terminalBorder pt-2">
          <span className="text-terminalText">$</span>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ニックネームを入力してください"
            maxLength={15}
            className="flex-1 bg-transparent outline-none text-terminalText placeholder-terminalAccent px-2 py-1"
            autoFocus
          />
          <button type="submit" className="bg-terminalAccent text-terminalBg font-bold px-3 py-1 rounded hover:bg-green-500 transition">
            入場
          </button>
        </form>
        {/* エラー表示・文字数カウンタ */}
        <div className="flex justify-between text-xs mt-1">
          <span className="text-error">{error}</span>
          <span className="text-terminalAccent">{nickname.length}/15</span>
        </div>
        <div className="mt-2 text-xs text-terminalAccent text-right">
          <a href="#" className="underline">利用規約</a>
        </div>
      </div>
    </div>
  );
}
