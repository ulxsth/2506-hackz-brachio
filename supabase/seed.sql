-- =============================================
-- TYPE 2 LIVE - Seed Data
-- 表示用テキスト（日本語）+ ローマ字テキスト対応
-- =============================================

-- 難易度
insert into public.difficulties (name, level, description) values
  ('beginner', 1, '初級レベル'),
  ('intermediate', 2, '中級レベル'),
  ('advanced', 3, '上級レベル'),
  ('expert', 4, 'エキスパートレベル');

-- =============================================
-- IT用語サンプルデータ（厳選）
-- =============================================

-- 基本的な英単語系（短くてタイピングしやすい）
insert into public.it_terms (display_text, romaji_text, difficulty_id, description, aliases) values
  ('html', 'html', 1, 'マークアップ言語', array['HTML']),
  ('css', 'css', 1, 'スタイルシート言語', array['CSS']),
  ('js', 'js', 1, 'JavaScript略称', array['JavaScript']),
  ('api', 'api', 2, 'プログラムインターフェース', array['API']),
  ('sql', 'sql', 1, '構造化クエリ言語', array['SQL']),
  ('git', 'git', 2, 'バージョン管理', array['Git']),
  ('aws', 'aws', 2, 'クラウドサービス', array['AWS']),
  ('app', 'app', 1, 'アプリケーション', array['application']),
  ('web', 'web', 1, 'ウェブ', array['World Wide Web']),
  ('json', 'json', 2, 'データ形式', array['JSON']),
  ('http', 'http', 1, '通信プロトコル', array['HTTP']),
  ('ui', 'ui', 1, 'ユーザーインターフェース', array['UI']),
  ('docker', 'docker', 3, 'コンテナ技術', array['Docker']),
  ('python', 'python', 1, 'プログラミング言語', array['Python']),
  ('java', 'java', 2, 'プログラミング言語', array['Java']);

-- 日本語カタカナ系（適度な長さ）
insert into public.it_terms (display_text, romaji_text, difficulty_id, description, aliases) values
  ('ブログ', 'burogu', 1, 'ウェブログ', array['blog']),
  ('チャット', 'chatto', 1, 'リアルタイム会話', array['chat']),
  ('ファイル', 'fairu', 1, 'データファイル', array['file']),
  ('テスト', 'tesuto', 1, '動作確認', array['test']),
  ('デバッグ', 'debaggu', 2, 'バグ修正', array['debug']),
  ('キャッシュ', 'kyasshu', 2, 'データ高速化', array['cache']),
  ('サーバー', 'saabaa', 1, 'サービス提供システム', array['server']),
  ('データベース', 'deetabeesu', 1, 'データ管理システム', array['database']),
  ('アルゴリズム', 'arugorizu', 2, '問題解決手順', array['algorithm']),
  ('スクレイピング', 'sukureipingu', 2, 'ウェブデータ収集', array['scraping']),
  ('フレームワーク', 'fureemuwaaku', 2, '開発基盤', array['framework']),
  ('バックエンド', 'bakkuendo', 2, 'サーバーサイド', array['backend']),
  ('フロントエンド', 'furontoendo', 2, 'クライアントサイド', array['frontend']),
  ('デプロイ', 'depuroi', 2, 'アプリ配布', array['deploy']);
