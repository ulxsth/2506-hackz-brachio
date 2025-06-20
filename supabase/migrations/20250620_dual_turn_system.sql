-- デュアルターンシステム対応のマイグレーション
-- 作成日: 2025-06-20

-- =============================================
-- 1. game_sessions テーブル拡張
-- =============================================

-- ターンシステム対応フィールドの追加
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS current_turn_type text check (current_turn_type in ('typing', 'constraint')) default 'constraint',
ADD COLUMN IF NOT EXISTS current_target_word text, -- 通常ターン用の提示単語
ADD COLUMN IF NOT EXISTS current_constraint_char char(1), -- 制約ターン用の指定文字
ADD COLUMN IF NOT EXISTS turn_start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS turn_sequence_number integer default 0,
ADD COLUMN IF NOT EXISTS turn_metadata jsonb default '{}'; -- 追加のターン情報

-- コメント追加
COMMENT ON COLUMN public.game_sessions.current_turn_type IS 'ターンタイプ: typing(通常), constraint(制約)';
COMMENT ON COLUMN public.game_sessions.current_target_word IS '通常ターン用の提示単語';
COMMENT ON COLUMN public.game_sessions.current_constraint_char IS '制約ターン用の指定文字';
COMMENT ON COLUMN public.game_sessions.turn_start_time IS 'ターン開始時刻';
COMMENT ON COLUMN public.game_sessions.turn_sequence_number IS 'ターン連番';
COMMENT ON COLUMN public.game_sessions.turn_metadata IS 'ターン追加情報(JSON)';

-- =============================================
-- 2. word_submissions テーブル拡張
-- =============================================

-- ターン情報とタイミング記録
ALTER TABLE public.word_submissions
ADD COLUMN IF NOT EXISTS turn_type text check (turn_type in ('typing', 'constraint')) default 'constraint',
ADD COLUMN IF NOT EXISTS target_word text, -- 通常ターン用（提示された単語）
ADD COLUMN IF NOT EXISTS constraint_char char(1), -- 制約ターン用（指定文字）
ADD COLUMN IF NOT EXISTS typing_start_time timestamp with time zone, -- タイピング開始時刻
ADD COLUMN IF NOT EXISTS typing_duration_ms integer, -- タイピング時間（ミリ秒）
ADD COLUMN IF NOT EXISTS speed_coefficient decimal default 1.0; -- タイピング速度係数

-- コメント追加
COMMENT ON COLUMN public.word_submissions.turn_type IS '提出時のターンタイプ';
COMMENT ON COLUMN public.word_submissions.target_word IS '通常ターン用の提示単語';
COMMENT ON COLUMN public.word_submissions.constraint_char IS '制約ターン用の指定文字';
COMMENT ON COLUMN public.word_submissions.typing_start_time IS 'タイピング開始時刻';
COMMENT ON COLUMN public.word_submissions.typing_duration_ms IS 'タイピング時間(ms)';
COMMENT ON COLUMN public.word_submissions.speed_coefficient IS 'タイピング速度係数';

-- =============================================
-- 3. インデックス追加
-- =============================================

-- ターンシステム関連のインデックス
CREATE INDEX IF NOT EXISTS idx_game_sessions_turn_type ON public.game_sessions(current_turn_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_turn_sequence ON public.game_sessions(turn_sequence_number);

CREATE INDEX IF NOT EXISTS idx_word_submissions_turn_type ON public.word_submissions(turn_type);
CREATE INDEX IF NOT EXISTS idx_word_submissions_target_word ON public.word_submissions(target_word) WHERE target_word IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_word_submissions_constraint_char ON public.word_submissions(constraint_char) WHERE constraint_char IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_word_submissions_typing_duration ON public.word_submissions(typing_duration_ms) WHERE typing_duration_ms IS NOT NULL;

-- =============================================
-- 4. 制約チェック追加
-- =============================================

-- タイピング時間の妥当性チェック（1ms-60秒の範囲）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'word_submissions_typing_duration_check'
    ) THEN
        ALTER TABLE public.word_submissions 
        ADD CONSTRAINT word_submissions_typing_duration_check 
        CHECK (typing_duration_ms IS NULL OR (typing_duration_ms >= 1 AND typing_duration_ms <= 60000));
    END IF;
END $$;

-- 速度係数の妥当性チェック（0.1-5.0の範囲）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'word_submissions_speed_coefficient_check'
    ) THEN
        ALTER TABLE public.word_submissions 
        ADD CONSTRAINT word_submissions_speed_coefficient_check 
        CHECK (speed_coefficient >= 0.1 AND speed_coefficient <= 5.0);
    END IF;
END $$;

-- ターン連番の妥当性チェック
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'game_sessions_turn_sequence_check'
    ) THEN
        ALTER TABLE public.game_sessions 
        ADD CONSTRAINT game_sessions_turn_sequence_check 
        CHECK (turn_sequence_number >= 0);
    END IF;
END $$;

-- =============================================
-- 5. 既存データの移行
-- =============================================

-- 既存のgame_sessionsのターンタイプを制約ターンとして設定
UPDATE public.game_sessions 
SET current_turn_type = 'constraint'
WHERE current_turn_type IS NULL;

-- 既存のword_submissionsのターンタイプを制約ターンとして設定
UPDATE public.word_submissions 
SET turn_type = 'constraint'
WHERE turn_type IS NULL;

-- =============================================
-- 6. 統計情報更新
-- =============================================

-- テーブル統計の更新
ANALYZE public.game_sessions;
ANALYZE public.word_submissions;
