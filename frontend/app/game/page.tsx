'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRoom } from '@/hooks/useRoom';
import { submitWord, updatePlayerScore } from '@/lib/room';
import { TurnManager, type TurnData } from '@/lib/turn-manager';
import { calculateScore } from '@/lib/scoring';
import { useTypingTimer } from '@/hooks/useTypingTimer';
import type { Database } from '@/lib/database.types';

type ITTerm = Database['public']['Tables']['it_terms']['Row'];

interface Player {
  name: string;
  score: number;
  rank: number;
}

/**
 * デュアルターンシステム対応のゲーム画面（MVP版）
 * 
 * 機能:
 * - 通常タイピングターン: 提示された単語を正確に入力
 * - 制約ターン: 指定文字を含むIT用語を入力
 * - 得点計算: 速度係数・制約係数・コンボ対応
 * - タイピング速度測定: WPM/精度追跡
 */
export default function GamePageMVP() {
  const router = useRouter();
  const { user, currentRoom, forceEndGame } = useRoom();
  const { startTimer, finishTimer, resetTimer } = useTypingTimer();
  
  // ゲーム基本状態
  const [timeLeft, setTimeLeft] = useState(300); // 5分
  const [currentInput, setCurrentInput] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);
  const [itTerms, setItTerms] = useState<ITTerm[]>([]);
  const [canPass, setCanPass] = useState(true);
  const [passCountdown, setPassCountdown] = useState(0);
  
  // ターンシステム
  const [turnManager, setTurnManager] = useState<TurnManager | null>(null);
  const [currentTurn, setCurrentTurn] = useState<TurnData | null>(null);
  
  // プレイヤー情報（モック）
  const [players, setPlayers] = useState<Player[]>([
    { name: 'あなた', score: 0, rank: 1 },
    { name: 'タイピング王', score: 120, rank: 2 },
    { name: 'コード忍者', score: 95, rank: 3 },
    { name: 'IT戦士', score: 80, rank: 4 }
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // ルーム情報とターンマネージャー初期化
  useEffect(() => {
    if (currentRoom?.id) {
      const manager = new TurnManager(currentRoom.id);
      setTurnManager(manager);
      console.log('🎮 ターンマネージャー初期化完了');
    }
  }, [currentRoom?.id]);

  // IT用語辞書の読み込み
  useEffect(() => {
    const loadItTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('it_terms')
          .select('*')
          .limit(1000);
        
        if (error) throw error;
        
        setItTerms(data || []);
        console.log(`📚 辞書読み込み完了: ${data?.length || 0}件`);
      } catch (error) {
        console.error('❌ 辞書読み込み失敗:', error);
      }
    };
    
    loadItTerms();
  }, []);

  // 初回ターン生成
  useEffect(() => {
    if (turnManager && !currentTurn) {
      generateNextTurn();
    }
  }, [turnManager, currentTurn]);

  // 次のターンを生成
  const generateNextTurn = async () => {
    if (!turnManager) return;
    
    try {
      const newTurn = await turnManager.generateNextTurn([]);
      setCurrentTurn(newTurn);
      resetTimer();
      
      console.log('🔄 新しいターン生成:', newTurn);
      
      // ターン開始時のメッセージ
      if (newTurn.type === 'typing') {
        setFeedback(`📝 通常ターン: 「${newTurn.targetWord}」を正確に入力してください`);
      } else {
        setFeedback(`🎯 制約ターン: 「${newTurn.constraintChar}」を含むIT用語を入力してください (係数×${newTurn.coefficient})`);
      }
      
      // 自動でフィードバックを消去
      setTimeout(() => setFeedback(''), 3000);
      
    } catch (error) {
      console.error('❌ ターン生成エラー:', error);
      setFeedback('ターン生成エラーが発生しました');
    }
  };

  // 単語提出処理
  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = currentInput.toLowerCase().trim();
    
    if (!word || !user || !currentRoom || !currentTurn) return;

    // タイピング測定終了
    const { duration, coefficient } = finishTimer();

    let isValid = false;
    let points = 0;
    let matchedTerm: ITTerm | null = null;

    // ターン種別による検証
    if (currentTurn.type === 'typing') {
      // 通常ターン: 提示された単語との完全一致
      if (currentTurn.targetWord && word === currentTurn.targetWord.toLowerCase()) {
        matchedTerm = itTerms.find(term => 
          term.romaji_text.toLowerCase() === currentTurn.targetWord?.toLowerCase()
        ) || null;
        isValid = !!matchedTerm;
      }
    } else if (currentTurn.type === 'constraint') {
      // 制約ターン: 指定文字を含み、辞書に存在する単語
      if (currentTurn.constraintChar && word.includes(currentTurn.constraintChar)) {
        matchedTerm = itTerms.find(term => 
          term.romaji_text.toLowerCase() === word
        ) || null;
        isValid = !!matchedTerm;
      }
    }

    if (isValid && matchedTerm) {
      // 正解処理
      const newCombo = combo + 1;
      
      // 得点計算
      const scoreCoefficient = currentTurn.type === 'typing' ? coefficient : currentTurn.coefficient;
      points = calculateScore({
        turnType: currentTurn.type,
        word: word,
        difficulty: matchedTerm.difficulty_id,
        coefficient: scoreCoefficient,
        combo: newCombo
      });
      
      // 状態更新
      setMyScore(prev => prev + points);
      setCombo(newCombo);
      setMaxCombo(max => Math.max(max, newCombo));
      setWords(prev => [...prev, matchedTerm.display_text]);
      
      // フィードバック
      if (currentTurn.type === 'typing') {
        setFeedback(`✅ 正解！「${matchedTerm.display_text}」 +${points}点 (${newCombo}コンボ) [速度係数×${coefficient.toFixed(1)}]`);
      } else {
        setFeedback(`✅ 正解！「${matchedTerm.display_text}」 +${points}点 (${newCombo}コンボ) [制約係数×${currentTurn.coefficient}]`);
      }
      
      // データベースに記録
      try {
        if (gameSessionId) {
          await submitWord({
            gameSessionId,
            playerId: user.id,
            word: matchedTerm.display_text,
            score: points,
            comboAtTime: newCombo,
            isValid: true,
            constraintsMet: currentTurn.type === 'typing' ? [] : [{ 
              letter: currentTurn.constraintChar || '', 
              coefficient: currentTurn.coefficient 
            }]
          });
          
          await updatePlayerScore({
            playerId: user.id,
            roomId: currentRoom.id,
            scoreToAdd: points,
            newCombo: newCombo
          });
        }
        
        console.log('✅ DB更新成功:', { word, points, newCombo });
      } catch (error) {
        console.error('❌ DB更新失敗:', error);
      }
      
      // 次のターンを生成
      generateNextTurn();
      
    } else {
      // 不正解処理
      setCombo(0);
      
      if (currentTurn.type === 'typing') {
        setFeedback(`❌ 「${currentTurn.targetWord}」を正確に入力してください...`);
      } else {
        if (!currentTurn.constraintChar || !word.includes(currentTurn.constraintChar)) {
          setFeedback(`❌ 「${currentTurn.constraintChar}」を含む単語を入力してください...`);
        } else {
          setFeedback('❌ 辞書に登録されていない単語です...');
        }
      }
    }

    // 入力をクリア
    setCurrentInput('');
    
    // フィードバックを3秒後に消去
    setTimeout(() => setFeedback(''), 3000);
  };

  // パス機能
  const handlePass = () => {
    if (!canPass) return;
    
    setCanPass(false);
    setPassCountdown(10);
    setCombo(0);
    
    // 次のターンを生成
    generateNextTurn();
    
    setFeedback('⏭️ パス！次のターンです');
    setTimeout(() => setFeedback(''), 3000);
  };

  // ゲーム終了処理
  const handleEndGame = async () => {
    if (!user || !currentRoom) return;
    
    try {
      if (currentRoom.host_id !== user.id) {
        alert('ゲーム終了はホストのみ可能です');
        return;
      }
      
      const result = await forceEndGame();
      if (result.success) {
        const roomId = currentRoom?.id || 'unknown';
        router.push(`/result?roomId=${roomId}`);
      } else {
        alert('ゲーム終了に失敗しました');
      }
    } catch (error) {
      console.error('❌ ゲーム終了エラー:', error);
      alert('エラーが発生しました');
    }
  };

  // タイマー効果
  useEffect(() => {
    if (timeLeft <= 0) {
      router.push('/result');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    // パスカウントダウン
    let passTimer: NodeJS.Timeout | null = null;
    if (passCountdown > 0) {
      passTimer = setInterval(() => {
        setPassCountdown(prev => {
          if (prev <= 1) {
            setCanPass(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
      if (passTimer) clearInterval(passTimer);
    };
  }, [timeLeft, passCountdown, router]);

  // ランキング更新
  useEffect(() => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const updatedPlayers = sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1
    }));
    setPlayers(updatedPlayers);
    
    const myPlayer = updatedPlayers.find(p => p.name === 'あなた');
    if (myPlayer) {
      setMyRank(myPlayer.rank);
    }
  }, [players.map(p => p.score).join(',')]);

  // 自分のスコアをプレイヤーリストに反映
  useEffect(() => {
    setPlayers(prev => prev.map(player => 
      player.name === 'あなた' 
        ? { ...player, score: myScore }
        : player
    ));
  }, [myScore]);

  // ゲーム終了チェック
  useEffect(() => {
    if (currentRoom?.status === 'finished') {
      const roomId = currentRoom?.id || 'unknown';
      router.push(`/result?roomId=${roomId}`);
    }
  }, [currentRoom?.status, currentRoom?.id, router]);

  const isHost = user && currentRoom && currentRoom.host_id === user.id;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              🎮 デュアルターンゲーム
            </h1>
            <div className="text-2xl font-mono text-cyan-400">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
          
          {isHost && (
            <button
              onClick={handleEndGame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              🔚 ゲーム終了
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインゲーム画面 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              {/* ターン情報 */}
              <div className="mb-6">
                {currentTurn && (
                  <div className="text-center">
                    {currentTurn.type === 'typing' ? (
                      <div className="text-2xl font-bold text-cyan-400 mb-2">
                        📝 通常ターン #{currentTurn.sequenceNumber}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-orange-400 mb-2">
                        🎯 制約ターン #{currentTurn.sequenceNumber}
                      </div>
                    )}
                    
                    {currentTurn.type === 'typing' && currentTurn.targetWord && (
                      <div className="text-4xl font-mono text-white bg-gray-900 rounded-lg p-4 mb-4">
                        {currentTurn.targetWord}
                      </div>
                    )}
                    
                    {currentTurn.type === 'constraint' && currentTurn.constraintChar && (
                      <div className="text-lg text-gray-300 mb-4">
                        「<span className="text-3xl font-bold text-orange-400">{currentTurn.constraintChar}</span>」を含むIT用語を入力
                        <span className="text-sm text-gray-400 ml-2">(係数×{currentTurn.coefficient})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 入力フォーム */}
              <form onSubmit={handleInputSubmit} className="mb-6">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onFocus={() => startTimer()}
                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="単語を入力してください..."
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium transition-all"
                  >
                    送信
                  </button>
                  <button
                    type="button"
                    onClick={handlePass}
                    disabled={!canPass}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      canPass 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {passCountdown > 0 ? `${passCountdown}s` : 'パス'}
                  </button>
                </div>
              </form>

              {/* フィードバック */}
              {feedback && (
                <div className="mb-6 p-4 bg-gray-900 rounded-lg text-center">
                  <div className="text-lg">{feedback}</div>
                </div>
              )}

              {/* 統計情報 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">{myScore}</div>
                  <div className="text-sm text-gray-400">スコア</div>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{combo}</div>
                  <div className="text-sm text-gray-400">コンボ</div>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{maxCombo}</div>
                  <div className="text-sm text-gray-400">最大コンボ</div>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-orange-400">#{myRank}</div>
                  <div className="text-sm text-gray-400">順位</div>
                </div>
              </div>

              {/* 入力履歴 */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-300">📜 入力履歴</h3>
                <div className="flex flex-wrap gap-2">
                  {words.map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* リーダーボード */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-center">🏆 リーダーボード</h3>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.name}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      player.name === 'あなた'
                        ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30'
                        : 'bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {player.rank}
                      </div>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="font-bold text-cyan-400">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ゲーム情報 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-center">ℹ️ ゲーム情報</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ルーム:</span>
                  <span>{currentRoom?.id?.slice(-6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">プレイヤー:</span>
                  <span>{user?.name || user?.id?.slice(-6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">辞書:</span>
                  <span>{itTerms.length}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ターン:</span>
                  <span>{currentTurn?.sequenceNumber || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
