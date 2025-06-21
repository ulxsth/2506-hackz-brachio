"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom } from '@/lib/supabase-atoms';
import { debugLog } from '@/lib/logger';
import { Button, Input } from '../components/ui';
import { useScrollToLeft } from '@/hooks/useScrollToLeft';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useAtom(userAtom);
  const [error, setError] = useState('');
  const router = useRouter();
  const { containerRef, scrollToLeft } = useScrollToLeft<HTMLDivElement>();

  // 初期状態を確認
  useEffect(() => {
    debugLog('HomePage - user:', user);
  }, []);

  // コンテンツ変更時にも左端へスクロール
  useEffect(() => {
    scrollToLeft();
  }, [nickname, error, scrollToLeft]);

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
    <div 
      ref={containerRef}
      className="overflow-x-auto w-full h-full hide-scrollbar"
      style={{ scrollBehavior: 'auto' }}
    >
      <div className="min-w-max w-full">
        {/* ターミナル風コマンド履歴 */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-terminalAccent">guest@trashcan</span>
            <span className="text-terminalText">$</span>
            <span className="text-terminalText">figlet -f smslant "TYPE 2 LIVE"</span>
          </div>
          <div className="mb-4 pl-6 border-l-2 border-terminalBorder">
            <pre className="text-green-400 font-mono text-[15px] leading-tight tracking-tight whitespace-pre bg-transparent p-0 m-0 text-left"
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
          <pre className="font-mono text-terminalText text-sm whitespace-pre leading-snug bg-transparent p-0 m-0 text-left">
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pl-6 border-l-2 border-terminalBorder">
          <Input
            label="ニックネーム"
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value)}
            placeholder="ニックネームを入力してください"
            maxLength={15}
            error={error}
            autoFocus
          />
          <div className="text-xs text-right">
            <span className="text-terminalAccent">{nickname.length}/15</span>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              入場
            </Button>
          </div>
        </form>
        <div className="mt-4 text-xs text-terminalAccent text-right">
          <a href="#" className="underline">利用規約</a>
        </div>
      </div>
    </div>
  );
}
