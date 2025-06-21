'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRoom } from '@/hooks/useRoom';
import { submitWord, updatePlayerScore, startGame } from '@/lib/room';
import { TurnManager, type TurnData } from '@/lib/turn-manager';
import { calculateScore } from '@/lib/scoring';
import { useTypingTimer } from '@/hooks/useTypingTimer';
import { TypingInput } from '@/components/TypingInput';
import { useWanaKanaValidator } from '@/hooks/useWanaKanaValidator';
import { Button, Card } from '@/components/ui';
import type { Database } from '@/lib/database.types';

type ITTerm = Database['public']['Tables']['it_terms']['Row'];

// 単語説明表示用の型定義
interface WordExplanation {
  word: string;
  description: string;
  difficulty: number;
  score: number;
  combo: number;
  isVisible: boolean;
}

// RPC関数の戻り値の型定義
interface StartGameSessionResult {
  success: boolean;
  phase: string;
  actual_start_time: string;
  session_id: string;
}

// 型ガード関数
function isStartGameSessionResult(data: unknown): data is StartGameSessionResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'session_id' in data &&
    'success' in data &&
    typeof (data as any).session_id === 'string'
  );
}

interface Player {
  id: string;
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
  const { startTimer, finishTimer, resetTimer, startTime } = useTypingTimer();

  // ゲーム基本状態
  const [timeLeft, setTimeLeft] = useState(300);
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

  // 単語説明表示用State
  const [explanation, setExplanation] = useState<WordExplanation | null>(null);

  // ターンシステム
  const [turnManager, setTurnManager] = useState<TurnManager | null>(null);
  const [currentTurn, setCurrentTurn] = useState<TurnData | null>(null);

  // WanaKana検証システム
  const wanaKanaValidator = useWanaKanaValidator({
    itTerms: itTerms,
    targetWord: currentTurn?.type === 'typing' ? currentTurn.targetWord : undefined,
    constraintChar: currentTurn?.type === 'constraint' ? currentTurn.constraintChar : undefined
  });

  // プレイヤー情報（モック）
  const [players, setPlayers] = useState<Player[]>([
    { id: 'player-1', name: 'あなた', score: 0, rank: 1 },
    { id: 'player-2', name: 'タイピング王', score: 120, rank: 2 },
    { id: 'player-3', name: 'コード忍者', score: 95, rank: 3 },
    { id: 'player-4', name: 'IT戦士', score: 80, rank: 4 }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  // ルーム情報とターンマネージャー初期化
  useEffect(() => {
    const initializeGame = async () => {
      if (currentRoom?.id && user?.id) {
        try {
          console.log('🎮 ゲーム初期化開始', { roomId: currentRoom.id, userId: user.id });

          // ゲームセッション開始
          if (currentRoom.host_id === user.id) {
            console.log('👑 ホストとしてゲーム開始処理を実行');
            const result = await startGame({
              userId: user.id,
              roomId: currentRoom.id,
              hostId: currentRoom.host_id
            });

            if (result.success && result.data) {
              console.log('✅ ゲームセッション開始成功', result.data);
              // result.dataはRPC関数から返されるJSONオブジェクト
              if (isStartGameSessionResult(result.data)) {
                setGameSessionId(result.data.session_id);
              } else {
                console.error('❌ 予期しないデータ形式', result.data);
              }
            } else {
              console.error('❌ ゲームセッション開始失敗', result.error);
            }
          } else {
            console.log('👤 非ホストプレイヤー：ゲーム開始を待機中');
            // 非ホストの場合は、ルーム状態変更を監視してセッションIDを取得
            // TODO: リアルタイム更新でセッションIDを取得
          }

          // ターンマネージャー初期化
          const manager = new TurnManager(currentRoom.id);
          setTurnManager(manager);
          console.log('🎮 ターンマネージャー初期化完了');

        } catch (error) {
          console.error('💥 ゲーム初期化エラー', error);
        }
      }
    };

    initializeGame();
  }, [currentRoom?.id, user?.id]);

  // 説明自動消去タイマー
  useEffect(() => {
    if (explanation?.isVisible) {
      const timer = setTimeout(() => {
        setExplanation(null);
      }, 5000); // 5秒後に自動消去

      return () => clearTimeout(timer);
    }
  }, [explanation]);

  // IT用語辞書の読み込み
  useEffect(() => {
    console.log('🔍 useEffect(IT用語読み込み)実行開始');

    const loadItTerms = async () => {
      try {
        console.log('🔍 IT用語データ読み込み開始...');
        console.log('🔍 Supabase接続確認:', !!supabase);

        const { data, error } = await supabase
          .from('it_terms')
          .select('*')
          .limit(1000);

        console.log('🔍 Supabaseクエリ結果:', { data: !!data, error, dataLength: data?.length });

        if (error) {
          console.error('❌ Supabaseクエリエラー:', error);
          throw error;
        }

        setItTerms(data || []);
        console.log(`📚 辞書読み込み完了: ${data?.length || 0}件`);

        // デバッグ: 最初の数件のdescriptionを確認
        if (data && data.length > 0) {
          console.log('🔍 最初の3件のdescription確認:',
            data.slice(0, 3).map(term => ({
              word: term.display_text,
              description: term.description,
              descriptionType: typeof term.description,
              descriptionLength: term.description?.length
            }))
          );
        } else {
          console.warn('⚠️ IT用語データが空です！');
        }
      } catch (error) {
        console.error('❌ 辞書読み込み失敗:', error);
        if (error instanceof Error) {
          console.error('❌ エラー詳細:', error.message);
        }
      }
    };

    loadItTerms();

    return () => {
      console.log('🔍 useEffect(IT用語読み込み)クリーンアップ');
    };
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
    const word = currentInput.trim();

    console.log('🔍 handleInputSubmit開始:', {
      word,
      itTermsLength: itTerms.length,
      hasUser: !!user,
      hasCurrentRoom: !!currentRoom,
      hasCurrentTurn: !!currentTurn
    });

    if (!word || !user || !currentRoom || !currentTurn) {
      console.log('⚠️ 処理条件不足でリターン');
      return;
    }

    // タイピング測定終了
    const { duration, coefficient } = finishTimer();

    // WanaKana検証システムを使用
    const validation = wanaKanaValidator.validateInput(word);
    let isValid = validation.isValid;
    let points = 0;
    let matchedTerm: ITTerm | null = null;

    // マッチした用語を特定
    console.log('🔍 用語マッチング開始:', {
      isValid,
      validationMatchedTerm: validation.matchedTerm,
      itTermsLength: itTerms.length,
      itTermsFirst3: itTerms.slice(0, 3).map(t => t.display_text)
    });

    if (isValid && validation.matchedTerm) {
      matchedTerm = itTerms.find(term =>
        term.display_text === validation.matchedTerm
      ) || null;

      console.log('🔍 用語マッチング結果:', {
        searchTerm: validation.matchedTerm,
        foundTerm: matchedTerm?.display_text,
        foundDescription: matchedTerm?.description
      });
    }

    // 制約ターンの追加検証
    if (currentTurn.type === 'constraint' && currentTurn.constraintChar && isValid) {
      // 制約文字が含まれているかの確認
      const constraintHiragana = validation.hiraganaPreview;
      const constraintCharHiragana = wanaKanaValidator.validator.validateInput(currentTurn.constraintChar).hiraganaPreview;

      if (!constraintHiragana.includes(constraintCharHiragana)) {
        isValid = false;
        matchedTerm = null;
      }
    }

    console.log('🔍 正解処理条件チェック:', {
      isValid,
      matchedTerm: matchedTerm?.display_text,
      willExecuteCorrectLogic: isValid && matchedTerm
    });

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

      // 単語説明を表示
      console.log('🔍 説明表示デバッグ:', {
        word: matchedTerm.display_text,
        description: matchedTerm.description,
        descriptionType: typeof matchedTerm.description,
        descriptionLength: matchedTerm.description?.length,
        fullTerm: matchedTerm
      });

      setExplanation({
        word: matchedTerm.display_text,
        description: matchedTerm.description || '説明がありません',
        difficulty: matchedTerm.difficulty_id,
        score: points,
        combo: newCombo,
        isVisible: true
      });

      // データベースに記録
      try {
        console.log('🔍 DB記録処理開始:', { gameSessionId, userId: user?.id });

        if (gameSessionId) {
          // タイピング測定データを取得
          const typingData = finishTimer();
          console.log('📊 タイピングデータ取得:', typingData);

          console.log('📝 submitWord呼び出し開始');
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
            }],
            // デュアルターンシステム対応
            turnType: currentTurn.type,
            targetWord: currentTurn.type === 'typing' ? currentTurn.targetWord : undefined,
            constraintChar: currentTurn.type === 'constraint' ? currentTurn.constraintChar : undefined,
            typingStartTime: startTime || undefined,
            typingDurationMs: typingData.duration,
            speedCoefficient: coefficient
          });
          console.log('✅ submitWord呼び出し完了');

          console.log('🎯 updatePlayerScore呼び出し開始');
          await updatePlayerScore({
            playerId: user.id,
            roomId: currentRoom.id,
            scoreToAdd: points,
            newCombo: newCombo
          });
          console.log('✅ updatePlayerScore呼び出し完了');
        } else {
          console.log('⚠️ gameSessionId がnullのため、DB記録をスキップ');
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

  // 説明を手動で閉じる機能
  const handleCloseExplanation = () => {
    setExplanation(null);
  };

  // Escキーで説明を閉じる機能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && explanation?.isVisible) {
        handleCloseExplanation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [explanation]);

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
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🎮 <span className="text-cyan-400">dual-turn-game</span>
            </h1>
            <div className="text-xl font-mono bg-gray-900 px-3 py-1 rounded border border-gray-700">
              <span className="text-yellow-400">{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
          </div>

          {isHost && (
            <Button
              variant="danger"
              onClick={handleEndGame}
              size="sm"
            >
              🔚 ゲーム終了
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Turn Information */}
            <Card>
              {currentTurn && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {currentTurn.type === 'typing' ? (
                      <span className="text-blue-400 font-bold">
                        📝 通常ターン #{currentTurn.sequenceNumber}
                      </span>
                    ) : (
                      <span className="text-purple-400 font-bold">
                        🎯 制約ターン #{currentTurn.sequenceNumber}
                      </span>
                    )}
                  </div>

                  {currentTurn.type === 'typing' && currentTurn.targetWord && (
                    <div className="text-2xl font-bold text-center py-4 bg-gray-900/50 rounded border border-gray-700">
                      <span className="text-yellow-400">{currentTurn.targetWord}</span>
                    </div>
                  )}

                  {currentTurn.type === 'constraint' && currentTurn.constraintChar && (
                    <div className="text-center py-4 bg-gray-900/50 rounded border border-gray-700">
                      <p className="text-lg text-purple-300 mb-2">
                        「<span className="text-yellow-400 font-bold mx-2">{currentTurn.constraintChar}</span>」を含むIT用語を入力してください
                      </p>
                      <span className="text-sm text-green-400">係数: ×{currentTurn.coefficient}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Input Form */}
            <Card>
              <form onSubmit={handleInputSubmit} className="space-y-4">
                <div>
                  <TypingInput
                    ref={inputRef}
                    value={currentInput}
                    onChange={setCurrentInput}
                    onSubmit={() => handleInputSubmit({ preventDefault: () => { } } as React.FormEvent)}
                    onFocus={() => startTimer()}
                    itTerms={itTerms}
                    targetWord={currentTurn?.type === 'typing' ? currentTurn.targetWord : undefined}
                    constraintChar={currentTurn?.type === 'constraint' ? currentTurn.constraintChar : undefined}
                    placeholder={
                      currentTurn?.type === 'typing'
                        ? `Type "${currentTurn.targetWord}"...`
                        : currentTurn?.type === 'constraint'
                          ? `Type IT term with "${currentTurn.constraintChar}"...`
                          : 'Type a word...'
                    }
                    showPreview={true}
                    showSuggestions={currentTurn?.type === 'constraint'}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button type="submit" className="flex-1">
                      Submit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePass}
                      disabled={!canPass}
                    >
                      {passCountdown > 0 ? `${passCountdown}s` : 'Pass'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>

            {/* Feedback */}
            {feedback && (
              <Card className="bg-blue-900/20 border-blue-500">
                <div className="text-blue-300">{feedback}</div>
              </Card>
            )}

            {/* 単語説明表示エリア */}
            {explanation && explanation.isVisible && (
              <Card className="bg-purple-900/20 border-purple-500">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-purple-300 font-bold">📖 単語説明</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCloseExplanation}
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-2">
                  <h5 className="text-yellow-400 font-bold text-lg">「{explanation.word}」</h5>
                  <div className="flex gap-4 text-sm text-gray-300">
                    <span>難易度: {explanation.difficulty}</span>
                    <span>獲得: {explanation.score}点 ({explanation.combo}コンボ)</span>
                  </div>
                  <div className="text-green-300 leading-relaxed mt-3">
                    {explanation.description}
                  </div>
                  {/* デバッグ情報（開発時のみ） */}
                  <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
                    <div>説明の長さ: {explanation.description?.length || 0}文字</div>
                    <div>説明の型: {typeof explanation.description}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{myScore}</div>
                  <div className="text-xs text-gray-400">SCORE</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{combo}</div>
                  <div className="text-xs text-gray-400">COMBO</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{maxCombo}</div>
                  <div className="text-xs text-gray-400">MAX COMBO</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">#{myRank}</div>
                  <div className="text-xs text-gray-400">RANK</div>
                </div>
              </div>
            </Card>

            {/* Word History */}
            <Card>
              <h3 className="text-cyan-400 font-bold mb-3">📜 Word History</h3>
              <div className="flex flex-wrap gap-2">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm border border-green-700"
                  >
                    {word}
                  </span>
                ))}
                {words.length === 0 && (
                  <span className="text-gray-500 text-sm">No words typed yet...</span>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Leaderboard */}
            <Card>
              <h3 className="text-yellow-400 font-bold mb-3">🏆 Leaderboard</h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center p-2 bg-gray-900/50 rounded border border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-xs font-bold text-black">
                        {player.rank}
                      </div>
                      <span className="text-green-300 text-sm">{player.name}</span>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">{player.score}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Game Info */}
            <Card>
              <h3 className="text-cyan-400 font-bold mb-3">ℹ️ Game Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Room:</span>
                  <span className="text-yellow-400 font-mono">{currentRoom?.id?.slice(-6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Player:</span>
                  <span className="text-green-400">{user?.name || user?.id?.slice(-6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dictionary:</span>
                  <span className="text-blue-400">{itTerms.length} terms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Turn:</span>
                  <span className="text-purple-400">#{currentTurn?.sequenceNumber || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
