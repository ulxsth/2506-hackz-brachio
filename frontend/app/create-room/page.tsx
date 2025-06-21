"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui';

export default function CreateRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(4);
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
          maxPlayers
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
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🏗️</div>
          <CardTitle>ルームを作成</CardTitle>
          <CardDescription>
            新しいゲームルームを作成します
          </CardDescription>
        </CardHeader>
      </Card>

      {/* エラー表示 */}
      {(error || globalError) && (
        <Card className="border-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-500">
              <span>⚠️</span>
              <p className="font-mono text-sm">{error || globalError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* フォーム */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {/* あいことば */}
            <Input
              label="あいことば *"
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCode(e.target.value)}
              placeholder="例: hoge123"
              maxLength={30}
              required
            />
            <p className="text-xs font-mono text-terminalText opacity-70 -mt-4">
              参加者がルームに入るためのパスワードです（1-30文字）
            </p>

            {/* 設定 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="制限時間"
                id="timeLimit"
                value={timeLimit.toString()}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeLimit(Number(e.target.value))}
              >
                <option value={0.5}>30秒</option>
                <option value={1}>1分</option>
                <option value={3}>3分</option>
                <option value={5}>5分</option>
                <option value={10}>10分</option>
                <option value={15}>15分</option>
              </Select>

              <Input
                label="最大人数"
                type="number"
                id="maxPlayers"
                value={maxPlayers.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPlayers(Number(e.target.value))}
                min="2"
                max="100"
                placeholder="2-100人"
              />
            </div>
            <p className="text-xs font-mono text-terminalText opacity-70 -mt-2">
              2人以上100人以下で設定してください
            </p>

            {/* 設定内容確認 */}
            <Card className="bg-terminalBorder bg-opacity-10">
              <CardHeader>
                <CardTitle className="text-base">設定内容</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 font-mono text-sm">
                  <p>• あいことば: <span className="text-terminalAccent">{roomCode || '未設定'}</span></p>
                  <p>• 制限時間: <span className="text-terminalAccent">
                    {timeLimit < 1 ? `${timeLimit * 60}秒` : `${timeLimit}分`}
                  </span></p>
                  <p>• 最大人数: <span className="text-terminalAccent">{maxPlayers}人</span></p>
                </div>
              </CardContent>
            </Card>

            {/* 接続状態 */}
            {connectionState === 'connecting' && (
              <div className="text-center font-mono text-sm text-terminalAccent">
                Supabaseに接続中...
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isCreating}
            >
              戻る
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isCreating}
            >
              {isCreating ? '作成中...' : 'ルーム作成'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
