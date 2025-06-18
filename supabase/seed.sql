-- カテゴリー
insert into public.categories (name, description) values
  ('web', 'Web開発関連'),
  ('database', 'データベース関連'),
  ('ai', 'AI・機械学習関連'),
  ('security', 'セキュリティ関連'),
  ('infrastructure', 'インフラ・クラウド関連'),
  ('programming', 'プログラミング言語関連'),
  ('all', '全分野');

-- 難易度
insert into public.difficulties (name, level, description) values
  ('beginner', 1, '初級レベル'),
  ('intermediate', 2, '中級レベル'),
  ('advanced', 3, '上級レベル'),
  ('expert', 4, 'エキスパートレベル');
