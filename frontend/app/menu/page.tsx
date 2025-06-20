"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom } from '@/lib/supabase-atoms';
import { debugLog } from '@/lib/logger';

export default function MenuPage() {
  const [user, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // atomWithStorage の復元を待つ
    // FIXME: 絶対ほかに方法あると思うよ
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // 短時間待って復元完了を確認

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // ローディング中は何もしない
    if (isLoading) return;

    debugLog('MenuPage - user:', user);

    if (!user?.name) {
      debugLog('No user, redirecting to /');
      router.push('/');
      return;
    }
  }, [user, router, isLoading]);

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    router.push('/join-room');
  };

  const handleChangeNickname = () => {
    setUser(null);
    router.push('/');
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user?.name) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <div>
          <div>
            <span>👋</span>
          </div>
          <h1>
            こんにちは、{user.name}さん！
          </h1>
          <p>何をしますか？</p>
        </div>

        <div>
          <button
            onClick={handleCreateRoom}
          >
            <span>🏗️</span>
            <span>ルームを作る</span>
          </button>

          <button
            onClick={handleJoinRoom}
          >
            <span>🚪</span>
            <span>ルームに参加する</span>
          </button>
        </div>

        <div>
          <button
            onClick={handleChangeNickname}
          >
            戻る
          </button>
        </div>

        <div>
          <h3>ゲームの流れ</h3>
          <div>
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
