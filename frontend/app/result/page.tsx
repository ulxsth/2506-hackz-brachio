"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { Button, Card } from '@/components/ui';

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  rank: number;
  wordCount: number;
  maxCombo: number;
  accuracy: number;
}

function ResultPageContent() {
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [myResult, setMyResult] = useState<PlayerResult | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getGameResults, gameResults, resultsLoading, resultsError } = useRoom();

  useEffect(() => {
    const loadGameResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // URLパラメータからルームIDを取得
        const roomId = searchParams.get('roomId') || searchParams.get('room');

        if (!roomId) {
          throw new Error('ルームIDが見つかりません');
        }

        // 実際のゲーム結果を取得
        const result = await getGameResults(roomId);

        if (result.success && result.data) {
          // 型を変換（API結果→UI表示用）
          const convertedResults: PlayerResult[] = result.data.results.map((player: any) => ({
            id: player.id,
            name: player.name,
            score: player.score,
            rank: player.rank,
            wordCount: player.wordCount,
            maxCombo: player.maxCombo,
            accuracy: player.accuracy
          }));

          setResults(convertedResults);

          // 自分の結果を特定（name="あなた"または最初のプレイヤー）
          const myData = convertedResults.find(r => r.name === 'あなた') || convertedResults[0];
          setMyResult(myData || null);
        } else {
          throw new Error(result.error || '結果の取得に失敗しました');
        }
      } catch (err) {
        console.error('結果取得エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');

        // エラー時はダミーデータにフォールバック
        const fallbackResults: PlayerResult[] = [
          {
            id: 'fallback-1',
            name: 'タイピング王',
            score: 1250,
            rank: 1,
            wordCount: 28,
            maxCombo: 12,
            accuracy: 94.2
          },
          {
            id: 'fallback-2',
            name: 'あなた',
            score: 1180,
            rank: 2,
            wordCount: 24,
            maxCombo: 8,
            accuracy: 89.7
          },
          {
            id: 'fallback-3',
            name: 'コード忍者',
            score: 980,
            rank: 3,
            wordCount: 22,
            maxCombo: 15,
            accuracy: 86.1
          },
          {
            id: 'fallback-4',
            name: 'IT戦士',
            score: 820,
            rank: 4,
            wordCount: 18,
            maxCombo: 6,
            accuracy: 92.3
          }
        ];

        setResults(fallbackResults);
        const myData = fallbackResults.find(r => r.name === 'あなた');
        setMyResult(myData || null);
      } finally {
        setLoading(false);
        // アニメーション開始
        setTimeout(() => setShowAnimation(true), 500);
      }
    };

    loadGameResults();
  }, [searchParams, getGameResults]); // useCallbackで安定化されたgetGameResultsを使用

  const handlePlayAgain = () => {
    router.push('/create-room');
  };

  const handleBackToMenu = () => {
    router.push('/menu');
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <Card>
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-lg font-bold text-cyan-400">Calculating results...</h2>
            <p className="text-green-300 text-sm">Please wait a moment</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <Card className="bg-red-900/20 border-red-500 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Error occurred</h2>
          <p className="text-red-300 text-sm mb-2">{error}</p>
          <p className="text-yellow-400 text-xs mb-4">※ Showing fallback data</p>
          <Button
            onClick={() => router.push('/menu')}
            variant="secondary"
          >
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  if (!myResult) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <Card>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              🎮 <span className="text-cyan-400">game-results</span> 🎮
            </h1>
            <div className="text-green-300 mt-2">
              <span className="bg-green-900/30 px-3 py-1 rounded border border-green-700">Game Complete!</span>
            </div>
          </div>
        </div>

        {/* Winner Display */}
        <Card className="text-center bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-500">
          <div className="space-y-3">
            <div className="text-6xl">{getRankIcon(1)}</div>
            <h2 className="text-2xl font-bold text-yellow-400">🏆 WINNER 🏆</h2>
            <div className="text-xl font-bold text-yellow-300">
              🎉 {results[0]?.name} 🎉
            </div>
            <div className="text-lg">
              Final Score: <span className="text-yellow-400 font-bold">{results[0]?.score}</span> pts
            </div>
          </div>
        </Card>

        {/* Final Rankings */}
        <Card>
          <h3 className="text-xl font-bold text-cyan-400 mb-4">📊 Final Rankings</h3>
          <div className="space-y-3">
            {results.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded border ${player.name === 'あなた' || player.name === myResult.name
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-gray-900/50 border-gray-700'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-r ${getRankColor(player.rank)}`}>
                    <span className="text-black">{player.rank}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-300">
                        {player.name}
                      </span>
                      {(player.name === 'あなた' || player.name === myResult.name) && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.wordCount} words • {player.maxCombo} max combo • {player.accuracy}% accuracy
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{player.score}</div>
                  <div className="text-xs text-gray-400">pts</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Your Detailed Stats */}
        <Card>
          <h3 className="text-xl font-bold text-yellow-400 mb-4">📈 Your Detailed Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-900/50 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Final Score</div>
              <div className="text-2xl font-bold text-yellow-400">{myResult.score}</div>
              <div className="text-xs text-gray-400">pts</div>
            </div>
            <div className="text-center p-3 bg-gray-900/50 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Words Typed</div>
              <div className="text-2xl font-bold text-green-400">{myResult.wordCount}</div>
              <div className="text-xs text-gray-400">words</div>
            </div>
            <div className="text-center p-3 bg-gray-900/50 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Max Combo</div>
              <div className="text-2xl font-bold text-purple-400">{myResult.maxCombo}</div>
              <div className="text-xs text-gray-400">streak</div>
            </div>
            <div className="text-center p-3 bg-gray-900/50 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Accuracy</div>
              <div className="text-2xl font-bold text-blue-400">{myResult.accuracy}%</div>
              <div className="text-xs text-gray-400">correct</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="inline-block p-3 bg-cyan-900/30 rounded border border-cyan-700">
              <div className="text-xs text-gray-400 mb-1">Average Score/Word</div>
              <div className="text-xl font-bold text-cyan-400">
                {myResult.wordCount > 0 ? Math.round(myResult.score / myResult.wordCount) : 0}
              </div>
              <div className="text-xs text-gray-400">pts/word</div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handlePlayAgain}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Play Again</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleBackToMenu}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>Back to Menu</span>
          </Button>
        </div>

        {/* Congratulations Message */}
        <Card className="text-center bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500">
          <div className="text-lg text-green-300">
            <p>
              {myResult.rank === 1 ? '🎉 Congratulations! Excellent typing skills! 🎉' :
                myResult.rank === 2 ? '🥈 So close! Aim for 1st place next time!' :
                  myResult.rank === 3 ? '🥉 Nice game! You still have room to grow!' :
                    '💪 Great job! Practice more and try again!'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Suspenseで囲んだメインコンポーネント
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <Card>
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-lg font-bold text-cyan-400">Loading results...</h2>
            <p className="text-green-300 text-sm">Please wait a moment</p>
          </div>
        </Card>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  );
}
