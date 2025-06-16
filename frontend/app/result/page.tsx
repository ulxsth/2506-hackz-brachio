"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PlayerResult {
  name: string;
  score: number;
  rank: number;
  wordCount: number;
  maxCombo: number;
  accuracy: number;
}

export default function ResultPage() {
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [myResult, setMyResult] = useState<PlayerResult | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // ダミーの結果データを生成
    const dummyResults: PlayerResult[] = [
      {
        name: 'タイピング王',
        score: 1250,
        rank: 1,
        wordCount: 28,
        maxCombo: 12,
        accuracy: 94.2
      },
      {
        name: 'あなた',
        score: 1180,
        rank: 2,
        wordCount: 24,
        maxCombo: 8,
        accuracy: 89.7
      },
      {
        name: 'コード忍者',
        score: 980,
        rank: 3,
        wordCount: 22,
        maxCombo: 15,
        accuracy: 86.1
      },
      {
        name: 'IT戦士',
        score: 820,
        rank: 4,
        wordCount: 18,
        maxCombo: 6,
        accuracy: 92.3
      }
    ];

    setResults(dummyResults);
    const myData = dummyResults.find(r => r.name === 'あなた');
    setMyResult(myData || null);

    // アニメーション開始
    setTimeout(() => setShowAnimation(true), 500);
  }, []);

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

  if (!myResult) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className={`transform transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <h1 className="text-4xl font-bold text-white mb-4">🎮 ゲーム結果 🎮</h1>
            <div className="bg-white rounded-full px-6 py-2 inline-block">
              <span className="text-2xl font-bold text-gray-800">ゲーム終了！</span>
            </div>
          </div>
        </div>

        {/* 勝者の表示 */}
        <div className={`bg-white rounded-xl shadow-2xl p-8 mb-6 transform transition-all duration-1000 delay-300 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{getRankIcon(1)}</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">優勝者</h2>
            <div className={`bg-gradient-to-r ${getRankColor(1)} text-white text-2xl font-bold py-4 px-8 rounded-lg inline-block mb-4`}>
              🎉 {results[0]?.name} 🎉
            </div>
            <div className="text-xl text-gray-600">
              最終得点: <span className="font-bold text-yellow-600">{results[0]?.score}</span>点
            </div>
          </div>
        </div>

        {/* 最終順位表 */}
        <div className={`bg-white rounded-xl shadow-2xl p-6 mb-6 transform transition-all duration-1000 delay-500 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">最終順位</h3>
          <div className="space-y-4">
            {results.map((player, index) => (
              <div
                key={player.name}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:shadow-md ${
                  player.name === 'あなた'
                    ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getRankColor(player.rank)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-xl font-bold">{player.rank}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xl font-bold ${
                        player.name === 'あなた' ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {player.name}
                      </span>
                      {player.name === 'あなた' && (
                        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {player.wordCount}語 • 最高{player.maxCombo}コンボ • 正解率{player.accuracy}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">{player.score}</div>
                  <div className="text-sm text-gray-500">点</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* あなたの詳細統計 */}
        <div className={`bg-white rounded-xl shadow-2xl p-6 mb-6 transform transition-all duration-1000 delay-700 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">あなたの詳細統計</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">最終得点</div>
                <div className="text-3xl font-bold text-blue-800">{myResult.score}</div>
                <div className="text-sm text-blue-600">pts</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">入力した単語数</div>
                <div className="text-3xl font-bold text-green-800">{myResult.wordCount}</div>
                <div className="text-sm text-green-600">語</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">最高コンボ</div>
                <div className="text-3xl font-bold text-orange-800">{myResult.maxCombo}</div>
                <div className="text-sm text-orange-600">連続</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">正解率</div>
                <div className="text-3xl font-bold text-purple-800">{myResult.accuracy}%</div>
                <div className="text-sm text-purple-600">accuracy</div>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">平均得点/単語</div>
              <div className="text-2xl font-bold text-gray-800">
                {Math.round(myResult.score / myResult.wordCount)}
              </div>
              <div className="text-sm text-gray-600">pts/word</div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-1000 delay-900 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button
            onClick={handlePlayAgain}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🔄</span>
            <span>もう一度遊ぶ</span>
          </button>
          <button
            onClick={handleBackToMenu}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span className="text-xl">🏠</span>
            <span>メニューに戻る</span>
          </button>
        </div>

        {/* おつかれさまメッセージ */}
        <div className={`text-center mt-8 transform transition-all duration-1000 delay-1100 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white bg-opacity-20 rounded-lg p-6">
            <p className="text-white text-lg">
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
