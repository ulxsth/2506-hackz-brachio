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

// レガシー制約インターフェース（後方互換性のため保持）
interface Constraint {
  type: string;
  description: string;
  letter: string;
  coefficient: number;
}

export default function GamePage() {
  const router = useRouter();
  const { user, currentRoom, forceEndGame } = useRoom();
  const { startTimer, finishTimer, resetTimer } = useTypingTimer();
  
  const [timeLeft, setTimeLeft] = useState(300); // 5分 = 300秒
  const [currentInput, setCurrentInput] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  
  // 新しいターンシステム
  const [currentTurn, setCurrentTurn] = useState<TurnData | null>(null);
  
  // レガシー制約システム（後方互換性のため保持）
  const [constraint, setConstraint] = useState<Constraint>({
    type: '文字制約',
    description: '「a」を含む単語',
    letter: 'a',
    coefficient: 2
  });
  
  const [players, setPlayers] = useState<Player[]>([
    { name: 'あなた', score: 0, rank: 1 },
    { name: 'タイピング王', score: 120, rank: 2 },
    { name: 'コード忍者', score: 95, rank: 3 },
    { name: 'IT戦士', score: 80, rank: 4 }
  ]);
  const [canPass, setCanPass] = useState(true);
  const [passCountdown, setPassCountdown] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);
  const [itTerms, setItTerms] = useState<ITTerm[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 新しいターン生成機能
  const generateNextTurn = async () => {
    if (!currentRoom?.id) return;
    
    try {
      const newTurn = await turnManager.generateNextTurn([]);
      setCurrentTurn(newTurn);
      
      // ゲームセッションにターン情報を更新
      if (gameSessionId) {
        await turnManager.updateGameSessionTurn(gameSessionId, newTurn);
      }
      
      // タイピングタイマーをリセット
      resetTimer();
      
      console.log('🔄 新しいターン生成:', newTurn);
    } catch (error) {
      console.error('❌ ターン生成エラー:', error);
      // フォールバック: レガシー制約システムを使用
      setConstraint(generateRandomConstraint());
    }
  };

  // レガシー制約生成機能（後方互換性のため保持）
  const generateRandomConstraint = (): Constraint => {
    // 文字と係数の定義（出現頻度による難易度設定）
    const letterCoefficients = [
      // 一般的な文字（係数2）
      { letters: ['a', 'e', 'i', 'o', 'u'], coefficient: 2 },
      // やや一般的な文字（係数3）
      { letters: ['r', 's', 't', 'n', 'l'], coefficient: 3 },
      // 中程度の文字（係数4）
      { letters: ['c', 'd', 'h', 'm', 'p'], coefficient: 4 },
      // やや希少な文字（係数5）
      { letters: ['b', 'f', 'g', 'k', 'v', 'w', 'y'], coefficient: 5 },
      // 希少な文字（係数6-8）
      { letters: ['j', 'q'], coefficient: 6 },
      { letters: ['x'], coefficient: 7 },
      { letters: ['z'], coefficient: 8 }
    ];

    // 全文字を係数と一緒にフラット化
    const allLetters: { letter: string; coefficient: number }[] = [];
    letterCoefficients.forEach(group => {
      group.letters.forEach(letter => {
        allLetters.push({ letter, coefficient: group.coefficient });
      });
    });

    // ランダムに選択
    const selected = allLetters[Math.floor(Math.random() * allLetters.length)];
    
    return {
      type: '文字制約',
      description: `「${selected.letter}」を含む単語`,
      letter: selected.letter,
      coefficient: selected.coefficient
    };
  };

  // Supabaseから用語データを取得 & 初期制約生成 & ゲームセッションID取得
  useEffect(() => {
    const fetchTerms = async () => {
      const { data, error } = await supabase
        .from('it_terms')
        .select('*')
        .order('difficulty_id', { ascending: true });
      
      if (data && !error) {
        setItTerms(data);
      }
    };
    
    // 現在のゲームセッションIDを取得
    const fetchGameSession = async () => {
      if (!currentRoom?.id) return;

      const { data, error } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('room_id', currentRoom.id)
        .eq('status', 'playing')
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setGameSessionId(data.id);
        console.log('🎮 ゲームセッションID取得:', data.id);
      } else {
        console.error('❌ ゲームセッションID取得失敗:', error);
      }
    };
    
    fetchTerms();
    fetchGameSession();
    
    // 初回のランダム制約を生成
    setConstraint(generateRandomConstraint());
  }, [currentRoom?.id]);

  useEffect(() => {
    // タイマー
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // ゲーム終了
          const roomId = currentRoom?.id || 'unknown';
          router.push(`/result?roomId=${roomId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // パスのクールダウンタイマー
    let passTimer: NodeJS.Timeout;
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

    // ダミー: 他プレイヤーのスコア更新
    const scoreTimer = setInterval(() => {
      setPlayers(prev => prev.map(player => 
        player.name !== 'あなた' 
          ? { ...player, score: player.score + Math.floor(Math.random() * 20) }
          : player
      ));
    }, 3000);

    return () => {
      clearInterval(timer);
      if (passTimer) clearInterval(passTimer);
      clearInterval(scoreTimer);
    };
  }, [router, passCountdown]);

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

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = currentInput.toLowerCase().trim();
    
    if (!word || !user || !currentRoom || !gameSessionId) return;

    // タイピング時間測定終了
    const { duration, coefficient } = finishTimer();

    let isValid = false;
    let points = 0;
    let matchedTerm: ITTerm | null = null;

    // 新しいターンシステムでの検証
    if (currentTurn) {
      switch (currentTurn.type) {
        case 'typing':
          // 通常ターン: 提示された単語との完全一致
          if (currentTurn.targetWord && word === currentTurn.targetWord.toLowerCase()) {
            matchedTerm = itTerms.find(term => 
              term.romaji_text.toLowerCase() === currentTurn.targetWord?.toLowerCase()
            ) || null;
            if (matchedTerm) {
              isValid = true;
            }
          }
          break;
          
        case 'constraint':
          // 制約ターン: 指定文字を含み、辞書に存在する単語
          if (currentTurn.constraintChar && word.includes(currentTurn.constraintChar)) {
            matchedTerm = itTerms.find(term => 
              term.romaji_text.toLowerCase() === word
            ) || null;
            if (matchedTerm) {
              isValid = true;
            }
          }
          break;
      }
      
      // 新しい得点計算システム
      if (isValid && matchedTerm) {
        const newCombo = combo + 1;
        
        points = calculateScore({
          turnType: currentTurn.type,
          word: word,
          difficulty: matchedTerm.difficulty_id,
          coefficient: currentTurn.type === 'typing' ? coefficient : currentTurn.coefficient,
          combo: newCombo
        });
        
        // 状態更新
        setMyScore(prev => prev + points);
        setCombo(newCombo);
        setMaxCombo(max => Math.max(max, newCombo));
        
        // フィードバック表示
        if (currentTurn.type === 'typing') {
          setFeedback(`正解！「${matchedTerm.display_text}」 +${points}点 (${newCombo}コンボ) [速度係数×${coefficient.toFixed(1)}]`);
        } else {
          setFeedback(`正解！「${matchedTerm.display_text}」 +${points}点 (${newCombo}コンボ) [制約係数×${currentTurn.coefficient}]`);
        }
        
        setWords(prev => [...prev, matchedTerm!.display_text]);
        
        // 次のターンを生成
        generateNextTurn();
      } else {
        // 不正解処理
        setCombo(0);
        if (currentTurn.type === 'typing') {
          setFeedback(`「${currentTurn.targetWord}」を正確に入力してください...`);
        } else {
          setFeedback(`「${currentTurn.constraintChar}」を含む有効なIT用語を入力してください...`);
        }
      }
    } else {
      // フォールバック: レガシー制約システムを使用
      if (word.includes(constraint.letter)) {
        matchedTerm = itTerms.find(term => 
          term.romaji_text.toLowerCase() === word
        ) || null;
        
        if (matchedTerm) {
          isValid = true;
        }
      }

      // 新しいコンボ値を計算
      const newCombo = isValid ? combo + 1 : 0;

      if (isValid && matchedTerm) {
        // レガシー得点計算式
        points = word.length * matchedTerm.difficulty_id * constraint.coefficient * newCombo;
        
        // フロントエンド状態更新
        setMyScore(prev => prev + points);
        setCombo(newCombo);
        setMaxCombo(max => Math.max(max, newCombo));
        setFeedback(`正解！「${matchedTerm.display_text}」 +${points}点 (${newCombo}コンボ) [${constraint.letter}:x${constraint.coefficient}]`);
        setWords(prev => [...prev, matchedTerm.display_text]);

        // プレイヤーリストの自分のスコアを更新
        setPlayers(prev => prev.map(player => 
          player.name === 'あなた' 
            ? { ...player, score: player.score + points }
            : player
        ));

        // 🔥 データベースに更新を反映
        try {
          // 1. 単語提出を記録
          await submitWord({
            gameSessionId: gameSessionId,
            playerId: user.id,
            word: matchedTerm.display_text,
            score: points,
            comboAtTime: newCombo,
            isValid: true,
            constraintsMet: [{ letter: constraint.letter, coefficient: constraint.coefficient }]
          });

          // 2. プレイヤースコアを更新
          await updatePlayerScore({
            playerId: user.id,
            roomId: currentRoom.id,
            scoreToAdd: points,
            newCombo: newCombo
          });

          console.log('✅ DB更新成功:', { word, points, newCombo });
        } catch (error) {
          console.error('❌ DB更新エラー:', error);
        }
      } else {
        setCombo(0);
        if (!word.includes(constraint.letter)) {
          setFeedback(`「${constraint.letter}」を含む単語を入力してください...`);
        } else {
          setFeedback('辞書に登録されていない単語です...');
        }

        // 🔥 無効な単語もDBに記録
        try {
          await submitWord({
            gameSessionId: gameSessionId,
            playerId: user.id,
            word: word,
            score: 0,
            comboAtTime: 0,
            isValid: false,
            constraintsMet: []
          });

          await updatePlayerScore({
            playerId: user.id,
            roomId: currentRoom.id,
            scoreToAdd: 0,
            newCombo: 0
          });
        } catch (error) {
          console.error('❌ 無効単語のDB記録エラー:', error);
        }
      }
    }

    setCurrentInput('');
    setTimeout(() => setFeedback(''), 3000);
  };

        console.log('✅ DB更新成功:', { word, points, newCombo });
      } catch (error) {
        console.error('❌ DB更新エラー:', error);
      }
    } else {
      setCombo(0);
      if (!word.includes(constraint.letter)) {
        setFeedback(`「${constraint.letter}」を含む単語を入力してください...`);
      } else {
        setFeedback('辞書に登録されていない単語です...');
      }

      // 🔥 無効な単語もDBに記録
      try {
        await submitWord({
          gameSessionId: gameSessionId,
          playerId: user.id,
          word: word,
          score: 0,
          comboAtTime: 0,
          isValid: false,
          constraintsMet: []
        });

        await updatePlayerScore({
          playerId: user.id,
          roomId: currentRoom.id,
          scoreToAdd: 0,
          newCombo: 0
        });
      } catch (error) {
        console.error('❌ 無効単語のDB記録エラー:', error);
      }
    }

    setCurrentInput('');
  };

  const handlePass = () => {
    if (!canPass) return;
    
    setCanPass(false);
    setPassCountdown(10);
    setCombo(0);
    
    // 制約をランダム生成
    const newConstraint = generateRandomConstraint();
    setConstraint(newConstraint);

    setFeedback(`制約変更！「${newConstraint.letter}」を含む単語を入力してください (係数x${newConstraint.coefficient})`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleQuitGame = () => {
    if (confirm('ゲームを終了しますか？')) {
      router.push('/result');
    }
  };

  // ホスト専用強制終了機能
  const handleForceQuitGame = async () => {
    if (!user || !currentRoom) {
      alert('ユーザー情報またはルーム情報が取得できません');
      return;
    }

    // ホスト権限チェック
    if (currentRoom.host_id !== user.id) {
      alert('ゲーム終了はホストのみ実行できます');
      return;
    }

    if (confirm('ゲームを強制終了しますか？\n全プレイヤーが結果画面に移動します。')) {
      try {
        const result = await forceEndGame();
        
        if (result.success) {
          // 結果画面に遷移
          const roomId = currentRoom?.id || 'unknown';
          router.push(`/result?roomId=${roomId}`);
        } else {
          alert(`ゲーム終了に失敗しました: ${result.error}`);
        }
      } catch (error) {
        console.error('ゲーム強制終了エラー:', error);
        alert('ゲーム終了に失敗しました');
      }
    }
  };

  // ホスト判定
  const isHost = user && currentRoom && currentRoom.host_id === user.id;

  // ルーム状態の監視（強制終了検知）
  useEffect(() => {
    if (currentRoom?.status === 'finished') {
      // ゲームが強制終了された場合は結果画面に遷移
      const roomId = currentRoom?.id || 'unknown';
      router.push(`/result?roomId=${roomId}`);
    }
  }, [currentRoom?.status, currentRoom?.id, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</div>
              <div className="text-sm text-gray-600">残り時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{myScore}</div>
              <div className="text-sm text-gray-600">得点</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{myRank}位</div>
              <div className="text-sm text-gray-600">現在の順位</div>
            </div>
          </div>
          {/* ホスト専用ゲーム終了ボタン */}
          {isHost && (
            <button
              onClick={handleForceQuitGame}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
              title="ホスト専用: 全プレイヤーのゲームを強制終了します"
            >
              👑 ゲーム終了
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* メインゲームエリア */}
          <div className="lg:col-span-2 space-y-4">
            {/* 制約表示 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">現在の制約</h2>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-700">{constraint.type}</span>
                  <span className="text-sm font-bold text-purple-800">係数 x{constraint.coefficient}</span>
                </div>
                <div className="text-lg font-semibold text-gray-800">{constraint.description}</div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={handlePass}
                  disabled={!canPass}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    canPass 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canPass ? 'パス' : `パス可能まで ${passCountdown}秒`}
                </button>
                <div className="text-sm text-gray-600">
                  制約を再生成できます（10秒クールダウン）
                </div>
              </div>
            </div>

            {/* タイピング入力エリア */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">「{constraint.letter}」を含むIT用語を入力</h2>
              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800 mb-2">
                    🎯 制約条件: 「{constraint.letter}」を含む単語 (係数x{constraint.coefficient})
                  </div>
                  <div className="text-sm text-gray-600">
                    辞書内のIT用語で「{constraint.letter}」を含む単語を入力してください
                  </div>
                </div>
              </div>
              <form onSubmit={handleInputSubmit} className="space-y-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={`「${constraint.letter}」を含むIT用語をローマ字で入力してください`}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  送信 (Enter)
                </button>
              </form>
              
              {/* フィードバック */}
              {feedback && (
                <div className={`mt-4 p-3 rounded-lg ${
                  feedback.includes('正解') 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {feedback}
                </div>
              )}
            </div>

            {/* コンボ表示 */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">現在のコンボ</span>
                  <div className="text-2xl font-bold text-orange-600">{combo}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">最高コンボ</span>
                  <div className="text-xl font-semibold text-gray-800">{maxCombo}</div>
                </div>
              </div>
              {combo > 0 && (
                <div className="mt-2 bg-orange-100 rounded-lg p-2 text-center">
                  <span className="text-orange-800 font-medium">🔥 {combo}連続正解中！</span>
                </div>
              )}
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-4">
            {/* ランキング */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">リアルタイムランキング</h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.name}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.name === 'あなた' 
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {player.rank}
                      </div>
                      <span className={`font-medium ${
                        player.name === 'あなた' ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                        {player.name}
                      </span>
                    </div>
                    <span className="font-bold text-gray-700">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 入力した単語 */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">入力した単語</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {words.length === 0 ? (
                  <p className="text-gray-500 text-sm">まだ単語を入力していません</p>
                ) : (
                  words.slice(-10).reverse().map((word, index) => (
                    <div key={index} className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <span className="font-mono text-green-800">{word}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
