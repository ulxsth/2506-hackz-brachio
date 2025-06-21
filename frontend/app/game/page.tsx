'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRoom } from '@/hooks/useRoom';
import { submitWord, updatePlayerScore, startGame } from '@/lib/room';
import { TurnManager, type TurnData } from '@/lib/turn-manager';
import { calculateScore } from '@/lib/scoring';
import { useTypingTimer } from '@/hooks/useTypingTimer';
import type { Database } from '@/lib/database.types';

type ITTerm = Database['public']['Tables']['it_terms']['Row'];

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
            
            if (result.success && result.data?.session_id) {
              console.log('✅ ゲームセッション開始成功', result.data);
              setGameSessionId(result.data.session_id);
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
    // TODO: WanaKana導入後、より柔軟な検証に変更予定
    if (currentTurn.type === 'typing') {
      // 通常ターン: 提示された単語との完全一致
      // 注意: targetWordは現在display_text（日本語）が入っている
      if (currentTurn.targetWord && word === currentTurn.targetWord.toLowerCase()) {
        matchedTerm = itTerms.find(term => 
          term.display_text.toLowerCase() === currentTurn.targetWord?.toLowerCase()
        ) || null;
        isValid = !!matchedTerm;
      }
    } else if (currentTurn.type === 'constraint') {
      // 制約ターン: 指定文字を含み、辞書に存在する単語
      // TODO: WanaKana導入後、ローマ字入力→ひらがな変換してマッチング
      if (currentTurn.constraintChar && word.includes(currentTurn.constraintChar)) {
        matchedTerm = itTerms.find(term => 
          term.display_text.toLowerCase() === word
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
    <div>
      <div>
        {/* ヘッダー */}
        <div>
          <div>
            <h1>
              🎮 デュアルターンゲーム
            </h1>
            <div>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
          
          {isHost && (
            <button
              onClick={handleEndGame}
            >
              🔚 ゲーム終了
            </button>
          )}
        </div>

        <div>
          {/* メインゲーム画面 */}
          <div>
            <div>
              {/* ターン情報 */}
              <div>
                {currentTurn && (
                  <div>
                    {currentTurn.type === 'typing' ? (
                      <div>
                        📝 通常ターン #{currentTurn.sequenceNumber}
                      </div>
                    ) : (
                      <div>
                        🎯 制約ターン #{currentTurn.sequenceNumber}
                      </div>
                    )}
                    
                    {currentTurn.type === 'typing' && currentTurn.targetWord && (
                      <div>
                        {currentTurn.targetWord}
                      </div>
                    )}
                    
                    {currentTurn.type === 'constraint' && currentTurn.constraintChar && (
                      <div>
                        「<span>{currentTurn.constraintChar}</span>」を含むIT用語を入力
                        <span>(係数×{currentTurn.coefficient})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 入力フォーム */}
              <form onSubmit={handleInputSubmit}>
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onFocus={() => startTimer()}
                    placeholder="単語を入力してください..."
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                  >
                    送信
                  </button>
                  <button
                    type="button"
                    onClick={handlePass}
                    disabled={!canPass}
                  >
                    {passCountdown > 0 ? `${passCountdown}s` : 'パス'}
                  </button>
                </div>
              </form>

              {/* フィードバック */}
              {feedback && (
                <div>
                  <div>{feedback}</div>
                </div>
              )}

              {/* 統計情報 */}
              <div>
                <div>
                  <div>{myScore}</div>
                  <div>スコア</div>
                </div>
                <div>
                  <div>{combo}</div>
                  <div>コンボ</div>
                </div>
                <div>
                  <div>{maxCombo}</div>
                  <div>最大コンボ</div>
                </div>
                <div>
                  <div>#{myRank}</div>
                  <div>順位</div>
                </div>
              </div>

              {/* 入力履歴 */}
              <div>
                <h3>📜 入力履歴</h3>
                <div>
                  {words.map((word, index) => (
                    <span
                      key={index}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div>
            {/* リーダーボード */}
            <div>
              <h3>🏆 リーダーボード</h3>
              <div>
                {players.map((player, index) => (
                  <div
                    key={player.id}
                  >
                    <div>
                      <div>
                        {player.rank}
                      </div>
                      <span>{player.name}</span>
                    </div>
                    <span>{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ゲーム情報 */}
            <div>
              <h3>ℹ️ ゲーム情報</h3>
              <div>
                <div>
                  <span>ルーム:</span>
                  <span>{currentRoom?.id?.slice(-6) || 'N/A'}</span>
                </div>
                <div>
                  <span>プレイヤー:</span>
                  <span>{user?.name || user?.id?.slice(-6) || 'N/A'}</span>
                </div>
                <div>
                  <span>辞書:</span>
                  <span>{itTerms.length}件</span>
                </div>
                <div>
                  <span>ターン:</span>
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
