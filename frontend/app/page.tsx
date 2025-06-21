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
    <div className="overflow-x-auto min-w-max w-full h-full hide-scrollbar">
      {/* ターミナル風コマンド履歴 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-terminalAccent">guest@trashcan</span>
          <span className="text-terminalText">$</span>
          <span className="text-terminalText">figlet -f smslant "TYPE 2 LIVE"</span>
        </div>
        <div className="mb-4 pl-6 border-l-2 border-terminalBorder">
          <pre className="text-green-400 font-mono text-[15px] leading-tight tracking-tight whitespace-pre overflow-x-auto min-w-max bg-transparent p-0 m-0"
            style={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
            {` ________  _____  ____  ___    __   _____   ______
/_  __/\\ \\/ / _ \\/ __/ |_  |  / /  /  _/ | / / __/
 / /    \\  / ___/ _/  / __/  / /___/ / | |/ / _/
/_/     /_/_/  /___/ /____/ /____/___/ |___/___/  `}
          </pre>
        </div>
      </div>
      {/* 以下、説明やフォームもコマンド風で */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-terminalAccent">guest@trashcan</span>
        <span className="text-terminalText">$</span>
        <span className="text-terminalText">cat about.txt</span>
      </div>
      <div className="mb-4 pl-6 border-l-2 border-terminalBorder">
        <pre className="font-mono text-terminalText text-sm whitespace-pre leading-snug bg-transparent p-0 m-0">
          {`[ゲームについて]
- 制約条件に沿ったIT用語をタイピング
- リアルタイムマルチプレイヤー対戦
- コンボで高得点を狙おう！
- 最大100人まで同時プレイ可能

[IT用語カテゴリー]
  * Web開発         (HTML, CSS, React等)
  * データベース     (SQL, MongoDB等)
  * AI・機械学習     (Python, TensorFlow等)
  * セキュリティ     (SSL, OAuth等)
  * インフラ         (AWS, Docker等)
  * プログラミング言語 (Java, C++等)

[得点計算式]
  得点 = 単語文字数 × 難易度 × 制約係数 × コンボ数
`}
        </pre>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-terminalAccent">guest@trashcan</span>
        <span className="text-terminalText">$</span>
        <span className="text-terminalText">register --nickname</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 pl-6 border-l-2 border-terminalBorder">
        <label htmlFor="nickname" className="text-sm font-semibold mb-1">ニックネーム</label>
        <input
          type="text"
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="ニックネームを入力してください"
          maxLength={15}
          className="bg-transparent outline-none text-terminalText placeholder-terminalAccent px-2 py-1 border-b border-terminalBorder"
          autoFocus
        />
        <div className="flex justify-between text-xs mt-1">
          <span className="text-error">{error}</span>
          <span className="text-terminalAccent">{nickname.length}/15</span>
        </div>
        <button type="submit" className="bg-terminalAccent text-terminalBg font-bold px-3 py-1 rounded hover:bg-green-500 transition self-end mt-2">
          入場
        </button>
      </form>
      <div className="mt-4 text-xs text-terminalAccent text-right">
        <a href="#" className="underline">利用規約</a>
      </div>
    </div>
  );
}
