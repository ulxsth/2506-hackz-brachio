"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom } from '@/lib/supabase-atoms';
import { debugLog } from '@/lib/logger';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui';

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
      <div className="flex items-center justify-center h-full">
        <div className="font-mono text-terminalText">Loading...</div>
      </div>
    );
  }

  if (!user?.name) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="font-mono text-terminalText">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* ヘッダー */}
      <Card>
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">👋</div>
          <CardTitle className="text-xl">
            こんにちは、{user.name}さん！
          </CardTitle>
          <CardDescription>
            何をしますか？
          </CardDescription>
        </CardHeader>
      </Card>

      {/* メインアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:bg-terminalBorder hover:bg-opacity-10 transition-colors cursor-pointer">
          <CardHeader>
            <div className="text-3xl mb-2">🏗️</div>
            <CardTitle>ルームを作る</CardTitle>
            <CardDescription>
              新しいゲームルームを作成して、他のプレイヤーを招待しましょう
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleCreateRoom}
              variant="primary"
              className="w-full"
            >
              ルーム作成
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:bg-terminalBorder hover:bg-opacity-10 transition-colors cursor-pointer">
          <CardHeader>
            <div className="text-3xl mb-2">🚪</div>
            <CardTitle>ルームに参加する</CardTitle>
            <CardDescription>
              既存のゲームルームに参加して、すぐにゲームを始めましょう
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleJoinRoom}
              variant="secondary"
              className="w-full"
            >
              ルーム参加
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* ゲームの流れ */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 ゲームの流れ</CardTitle>
          <CardDescription>
            初めての方はこちらをお読みください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-start gap-3">
              <span className="text-terminalAccent font-bold">1.</span>
              <span>ルームを作成するか、既存のルームに参加</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-terminalAccent font-bold">2.</span>
              <span>2人以上集まったらゲーム開始</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-terminalAccent font-bold">3.</span>
              <span>制約に沿ったIT用語をタイピング</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-terminalAccent font-bold">4.</span>
              <span>制限時間内により多くの得点を獲得しよう！</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* フッター */}
      <div className="flex justify-center">
        <Button
          onClick={handleChangeNickname}
          variant="ghost"
          size="sm"
        >
          ← ニックネーム変更
        </Button>
      </div>
    </div>
  );
}
