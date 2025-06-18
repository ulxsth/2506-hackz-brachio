# TYPE 2 LIVE 実装計画書

## 📅 作成日
2025年6月19日

## 🎯 実装の全体戦略

### 現状分析 📊
- ✅ **基本インフラ**: Supabase設定・DB schema完成
- ✅ **基本機能**: ルーム作成・参加機能実装済み
- 🔄 **実装中**: リアルタイム同期システム
- ❌ **未実装**: ゲーム同期システム・タイピング機能

### 実装フェーズ構成 🚀

---

## Phase 1: ゲーム同期システム基盤 ⏰
**期間**: 1-2日  
**目標**: 全員が同じタイミングでゲーム開始できる仕組み

### 1.1 サーバー時刻同期機能
```sql
-- PostgreSQL関数作成
create or replace function get_server_time()
returns timestamptz
language sql
stable
as $$
  select now();
$$;
```

### 1.2 プレイヤー準備状態管理
```sql
-- 準備状態テーブル追加
create table public.player_ready_states (
  player_id text primary key,
  room_id text not null,
  assets_loaded boolean default false,
  network_ready boolean default false,
  ui_ready boolean default false,
  ready_at timestamp with time zone,
  
  constraint player_ready_states_player_id_fkey 
    foreign key (player_id) references public.room_players(id) on delete cascade,
  constraint player_ready_states_room_id_fkey 
    foreign key (room_id) references public.rooms(id) on delete cascade
);
```

### 1.3 ゲーム状態拡張
```sql
-- rooms テーブルに状態フィールド追加
alter table public.rooms 
add column game_state jsonb default '{}';

-- ゲーム状態の例
-- {
--   "phase": "waiting" | "preparing" | "countdown" | "playing" | "finished",
--   "start_time": "2025-06-19T10:00:00Z",
--   "countdown_start": "2025-06-19T09:59:55Z",
--   "preparation_deadline": "2025-06-19T09:59:00Z"
-- }
```

### 1.4 TypeScript実装
```typescript
// lib/game-sync.ts
export class GameSyncManager {
  private supabase: SupabaseClient
  private roomId: string
  private playerId: string
  
  async synchronizeServerTime(): Promise<Date>
  async updateReadyState(state: ReadyState): Promise<void>
  async startPreparationPhase(): Promise<void>
  async startCountdown(): Promise<void>
  async startGame(): Promise<void>
}

// hooks/useGameSync.ts
export const useGameSync = (roomId: string, playerId: string) => {
  // ゲーム同期の状態管理とリアルタイム監視
}
```

---

## Phase 2: IT用語辞書システム 📚
**期間**: 1日  
**目標**: ゲームで使用するIT用語データの管理

### 2.1 IT用語テーブル設計
```sql
create table public.it_terms (
  id uuid default gen_random_uuid() primary key,
  term text not null unique,              -- IT用語
  category text not null,                 -- カテゴリ（Web, DB, AI等）
  difficulty integer not null default 1,  -- 難易度（1-10）
  description text,                       -- 説明
  created_at timestamp with time zone default now()
);

-- インデックス作成
create index it_terms_category_idx on public.it_terms(category);
create index it_terms_difficulty_idx on public.it_terms(difficulty);
create index it_terms_term_trgm_idx on public.it_terms using gin (term gin_trgm_ops);
```

### 2.2 制約システムテーブル
```sql
create table public.constraints (
  id uuid default gen_random_uuid() primary key,
  type text not null,                     -- 制約タイプ
  parameters jsonb not null,              -- 制約パラメータ
  coefficient decimal not null default 1.0, -- 難易度係数
  description text not null
);

-- 制約タイプの例
-- "starts_with": {"letter": "a"}
-- "contains": {"letter": "p"}
-- "category": {"categories": ["Web", "DB"]}
-- "length": {"min": 5, "max": 10}
```

### 2.3 辞書API実装
```typescript
// lib/dictionary.ts
export class ITTermsDictionary {
  async searchTerms(constraints: Constraint[]): Promise<ITTerm[]>
  async validateTerm(term: string, constraints: Constraint[]): Promise<boolean>
  async getTermScore(term: string, constraints: Constraint[]): Promise<number>
}

// 制約フィルタリング例
const searchWithConstraints = async (constraints) => {
  let query = supabase.from('it_terms').select('*')
  
  constraints.forEach(constraint => {
    switch (constraint.type) {
      case 'starts_with':
        query = query.ilike('term', `${constraint.parameters.letter}%`)
        break
      case 'contains':
        query = query.ilike('term', `%${constraint.parameters.letter}%`)
        break
      case 'category':
        query = query.in('category', constraint.parameters.categories)
        break
    }
  })
  
  return query
}
```

---

## Phase 3: タイピング機能とスコアシステム ⌨️
**期間**: 2-3日  
**目標**: リアルタイムタイピング判定と得点計算

### 3.1 ゲームセッション管理拡張
```sql
-- word_submissions テーブル修正
alter table public.word_submissions 
add column validation_time timestamp with time zone default now(),
add column client_latency integer, -- クライアント側で測定した遅延
add column server_latency integer; -- サーバー側で測定した遅延
```

### 3.2 リアルタイムタイピングシステム
```typescript
// lib/typing-engine.ts
export class TypingEngine {
  private currentInput: string = ''
  private validationDebounce: NodeJS.Timeout | null = null
  
  async handleKeyInput(key: string): Promise<void> {
    this.currentInput += key
    
    // リアルタイム表示更新
    this.updateDisplayState(this.currentInput)
    
    // デバウンス付きバリデーション
    this.debounceValidation()
  }
  
  private async debounceValidation(): Promise<void> {
    if (this.validationDebounce) {
      clearTimeout(this.validationDebounce)
    }
    
    this.validationDebounce = setTimeout(async () => {
      const isValid = await this.validateInput(this.currentInput)
      if (isValid) {
        await this.submitWord(this.currentInput)
        this.currentInput = ''
      }
    }, 300) // 300ms のデバウンス
  }
}

// hooks/useTyping.ts
export const useTyping = (roomId: string, playerId: string) => {
  const [currentInput, setCurrentInput] = useState('')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  
  // キーボードイベントハンドリング
  // スコア計算
  // リアルタイム更新
}
```

### 3.3 スコア計算システム
```typescript
// lib/scoring.ts
export class ScoringSystem {
  calculateScore(params: {
    term: string
    difficulty: number
    constraints: Constraint[]
    combo: number
  }): number {
    const { term, difficulty, constraints, combo } = params
    
    // 基本得点 = 文字数 × 難易度
    const baseScore = term.length * difficulty
    
    // 制約係数の積算
    const constraintMultiplier = constraints.reduce(
      (acc, constraint) => acc * constraint.coefficient, 
      1.0
    )
    
    // コンボボーナス
    const comboMultiplier = Math.min(1 + (combo * 0.1), 3.0) // 最大3倍
    
    return Math.floor(baseScore * constraintMultiplier * comboMultiplier)
  }
}
```

---

## Phase 4: リアルタイム順位・状態同期 📊
**期間**: 1-2日  
**目標**: 全プレイヤーの状態をリアルタイムで同期

### 4.1 Realtime購読システム
```typescript
// lib/realtime-sync.ts
export class RealtimeGameSync {
  private channel: RealtimeChannel | null = null
  
  async subscribeToRoom(roomId: string): Promise<void> {
    this.channel = supabase
      .channel(`game_room_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        this.handlePlayerUpdate(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'word_submissions'
      }, (payload) => {
        this.handleWordSubmission(payload)
      })
      .on('broadcast', {
        event: 'game_state_change'
      }, (payload) => {
        this.handleGameStateChange(payload)
      })
      .subscribe()
  }
}
```

### 4.2 順位計算システム
```typescript
// lib/ranking.ts
export class RankingSystem {
  async updateRealTimeRanking(roomId: string): Promise<void> {
    const { data: players } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false })
    
    // Realtime broadcast で順位更新を通知
    await supabase
      .channel(`game_room_${roomId}`)
      .send({
        type: 'broadcast',
        event: 'ranking_update',
        payload: { rankings: players }
      })
  }
}
```

---

## Phase 5: UI/UX実装 🎨
**期間**: 2-3日  
**目標**: 使いやすくレスポンシブなゲームUI

### 5.1 ゲーム画面コンポーネント
```typescript
// components/game/GameScreen.tsx
export const GameScreen = ({ roomId, playerId }: Props) => {
  const { gameState, players } = useGameSync(roomId, playerId)
  const { currentInput, score, combo } = useTyping(roomId, playerId)
  const { constraints } = useConstraints(roomId)
  
  return (
    <div className="game-screen">
      <GameHeader 
        timeRemaining={gameState.timeRemaining}
        phase={gameState.phase}
      />
      
      <ConstraintsDisplay constraints={constraints} />
      
      <TypingArea 
        currentInput={currentInput}
        onKeyPress={handleKeyPress}
      />
      
      <ScoreBoard 
        players={players}
        currentPlayer={{ score, combo }}
      />
      
      <GameSyncIndicator 
        latency={gameState.latency}
        connectionStatus={gameState.connectionStatus}
      />
    </div>
  )
}
```

### 5.2 準備フェーズUI
```typescript
// components/game/PreparationPhase.tsx
export const PreparationPhase = ({ roomId, playerId }: Props) => {
  const { readyStates, startCountdown } = useGameSync(roomId, playerId)
  
  return (
    <div className="preparation-phase">
      <h2>ゲーム開始準備中...</h2>
      
      <PreparationProgress 
        assetsLoaded={readyStates.assetsLoaded}
        networkReady={readyStates.networkReady}
        uiReady={readyStates.uiReady}
      />
      
      <PlayersReadyList players={readyStates.players} />
      
      {readyStates.allReady && (
        <CountdownDisplay countdown={readyStates.countdown} />
      )}
    </div>
  )
}
```

---

## Phase 6: テスト・最適化 🧪
**期間**: 1-2日  
**目標**: 性能テストと最適化

### 6.1 性能テスト
```typescript
// __tests__/performance/game-sync.test.ts
describe('Game Sync Performance', () => {
  test('should synchronize within 100ms', async () => {
    const start = Date.now()
    await gameSyncManager.synchronizeServerTime()
    const latency = Date.now() - start
    
    expect(latency).toBeLessThan(100)
  })
  
  test('should handle 8 concurrent players', async () => {
    // 8人同時接続テスト
  })
})
```

### 6.2 最適化項目
- **バンドルサイズ**: コード分割とTree shaking
- **レンダリング**: React.memo とuseMemo の活用
- **ネットワーク**: 不要なリクエストの削減
- **キャッシュ**: Supabase クエリキャッシュの活用

---

## 🛠️ 実装の始め方

### 今すぐ始められるステップ：

1. **Phase 1から開始** 🚀
   ```bash
   # まずはサーバー時刻同期機能から
   cd supabase
   supabase migration new add_game_sync_functions
   ```

2. **DB Migration作成**
   ```sql
   -- サーバー時刻関数とプレイヤー準備状態テーブル
   ```

3. **TypeScript型定義更新**
   ```bash
   cd frontend
   supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
   ```

### 各フェーズの完了条件：
- **Phase 1**: 8人が同時にゲーム開始できる
- **Phase 2**: IT用語の検索・フィルタリングが動作
- **Phase 3**: タイピング判定とスコア計算が正確
- **Phase 4**: リアルタイムで順位が更新される
- **Phase 5**: 使いやすいゲームUIが完成
- **Phase 6**: 性能要件を満たす

## 📊 進捗管理

各フェーズごとに：
1. ✅ **実装完了**
2. 🧪 **テスト完了** 
3. 📝 **ドキュメント更新**

どのフェーズから始めたいですか？ 🎯
