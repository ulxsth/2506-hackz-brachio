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
    <div>
      <div>
        <div>
          <h1 className='text-3xl font-bold underline'>TYPE 2 LIVE</h1>
          <p>ITタイピングゲーム</p>
        </div>

        <div>
          <h2>ゲームについて</h2>
          <div>
            <div>
              <p>• 制約条件に沿ったIT用語をタイピング</p>
              <p>• リアルタイムマルチプレイヤー対戦</p>
              <p>• コンボで高得点を狙おう！</p>
              <p>• 最大100人まで同時プレイ可能</p>
            </div>
            <div>
              <p>IT用語カテゴリー:</p>
              <div>
                <span>• Web開発 (HTML, CSS, React等)</span>
                <span>• データベース (SQL, MongoDB等)</span>
                <span>• AI・機械学習 (Python, TensorFlow等)</span>
                <span>• セキュリティ (SSL, OAuth等)</span>
                <span>• インフラ (AWS, Docker等)</span>
                <span>• プログラミング言語 (Java, C++等)</span>
              </div>
            </div>
            <div>
              <p>得点計算式:</p>
              <p>
                得点 = 単語文字数 × 難易度 × 制約係数 × コンボ数
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nickname">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネームを入力してください"
              maxLength={15}
            />
            <div>
              <span>1-15文字</span>
              <span>{nickname.length}/15</span>
            </div>
          </div>

          {error && (
            <div>
              {error}
            </div>
          )}

          <button
            type="submit"
          >
            入場
          </button>
        </form>

        <div>
          <a href="#">
            利用規約
          </a>
        </div>
      </div>
    </div>
  );
}
