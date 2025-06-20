"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';

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
      <div>
        <div>
          <div>
            <div></div>
            <h2>結果を集計中...</h2>
            <p>しばらくお待ちください</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div>
          <div>⚠️</div>
          <h2>エラーが発生しました</h2>
          <p>{error}</p>
          <p>※ ダミーデータで表示しています</p>
          <button
            onClick={() => router.push('/menu')}
          >
            メニューに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!myResult) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {/* ヘッダー */}
        <div>
          <div>
            <h1>🎮 ゲーム結果 🎮</h1>
            <div>
              <span>ゲーム終了！</span>
            </div>
          </div>
        </div>

        {/* 勝者の表示 */}
        <div>
          <div>
            <div>{getRankIcon(1)}</div>
            <h2>優勝者</h2>
            <div>
              🎉 {results[0]?.name} 🎉
            </div>
            <div>
              最終得点: <span>{results[0]?.score}</span>点
            </div>
          </div>
        </div>

        {/* 最終順位表 */}
        <div>
          <h3>最終順位</h3>
          <div>
            {results.map((player, index) => (
              <div
                key={player.id}
              >
                <div>
                  <div>
                    <span>{player.rank}</span>
                  </div>
                  <div>
                    <div>
                      <span>
                        {player.name}
                      </span>
                      {player.name === 'あなた' && (
                        <span>
                          YOU
                        </span>
                      )}
                    </div>
                    <div>
                      {player.wordCount}語 • 最高{player.maxCombo}コンボ • 正解率{player.accuracy}%
                    </div>
                  </div>
                </div>
                <div>
                  <div>{player.score}</div>
                  <div>点</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* あなたの詳細統計 */}
        <div>
          <h3>あなたの詳細統計</h3>
          <div>
            <div>
              <div>
                <div>最終得点</div>
                <div>{myResult.score}</div>
                <div>pts</div>
              </div>
              <div>
                <div>入力した単語数</div>
                <div>{myResult.wordCount}</div>
                <div>語</div>
              </div>
            </div>
            <div>
              <div>
                <div>最高コンボ</div>
                <div>{myResult.maxCombo}</div>
                <div>連続</div>
              </div>
              <div>
                <div>正解率</div>
                <div>{myResult.accuracy}%</div>
                <div>accuracy</div>
              </div>
            </div>
          </div>
          <div>
            <div>
              <div>平均得点/単語</div>
              <div>
                {myResult.wordCount > 0 ? Math.round(myResult.score / myResult.wordCount) : 0}
              </div>
              <div>pts/word</div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div>
          <button
            onClick={handlePlayAgain}
          >
            <span>🔄</span>
            <span>もう一度遊ぶ</span>
          </button>
          <button
            onClick={handleBackToMenu}
          >
            <span>🏠</span>
            <span>メニューに戻る</span>
          </button>
        </div>

        {/* おつかれさまメッセージ */}
        <div>
          <div>
            <p>
              {myResult.rank === 1 ? '🎉 おめでとうございます！素晴らしいタイピングでした！ 🎉' :
               myResult.rank === 2 ? '🥈 惜しい！次回は1位を目指しましょう！' :
               myResult.rank === 3 ? '🥉 ナイスゲーム！まだまだ伸びしろがありますね！' :
               '💪 お疲れ様でした！練習してまた挑戦しましょう！'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspenseで囲んだメインコンポーネント
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div>
        <div>
          <div>
            <div></div>
            <h2>結果を読み込み中...</h2>
            <p>しばらくお待ちください</p>
          </div>
        </div>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  );
}
