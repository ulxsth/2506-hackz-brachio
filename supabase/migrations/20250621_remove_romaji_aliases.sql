-- =============================================
-- WanaKana リアルタイム検証システム対応
-- romaji_text, aliases カラム削除
-- Created: 2025-06-21
-- =============================================

-- romaji_text に依存するインデックスを削除
drop index if exists public.idx_it_terms_romaji_text;
drop index if exists public.idx_it_terms_romaji_text_trgm;

-- romaji_text の制約を削除
alter table public.it_terms drop constraint if exists it_terms_romaji_text_length;

-- romaji_text カラムを削除
alter table public.it_terms drop column if exists romaji_text;

-- aliases カラムを削除
alter table public.it_terms drop column if exists aliases;

-- 必要に応じてテーブルコメントを更新
comment on table public.it_terms is 'IT用語辞書（WanaKana動的変換対応版）';

-- display_text の制約とインデックスは維持
-- （WanaKanaでdisplay_textからローマ字を動的変換するため）
