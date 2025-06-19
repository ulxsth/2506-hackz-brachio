-- =============================================
-- TYPE 2 LIVE - Seed Data
-- シンプル版（カテゴリ機能削除済み）
-- =============================================

-- 難易度
insert into public.difficulties (name, level, description) values
  ('beginner', 1, '初級レベル'),
  ('intermediate', 2, '中級レベル'),
  ('advanced', 3, '上級レベル'),
  ('expert', 4, 'エキスパートレベル');

-- =============================================
-- IT用語サンプルデータ
-- =============================================

-- Web開発関連の用語
insert into public.it_terms (term, difficulty_id, description, aliases) values
  ('JavaScript', 1, 'プログラミング言語', array['JS', 'javascript']),
  ('TypeScript', 2, 'JavaScriptの上位互換言語', array['TS', 'typescript']),
  ('React', 2, 'フロントエンドライブラリ', array['ReactJS']),
  ('Next.js', 3, 'React フレームワーク', array['NextJS']),
  ('HTML', 1, 'マークアップ言語', array['html']),
  ('CSS', 1, 'スタイルシート言語', array['css']),
  ('Node.js', 2, 'JavaScript ランタイム', array['NodeJS', 'Node']);

-- データベース関連の用語
insert into public.it_terms (term, difficulty_id, description, aliases) values
  ('SQL', 1, '構造化クエリ言語', array['sql']),
  ('PostgreSQL', 2, 'オープンソースRDB', array['Postgres', 'postgres']),
  ('MySQL', 2, 'オープンソースRDB', array['mysql']),
  ('MongoDB', 2, 'NoSQLデータベース', array['mongo']),
  ('Redis', 3, 'インメモリデータベース', array['redis']);

-- AI・機械学習関連の用語
insert into public.it_terms (term, difficulty_id, description, aliases) values
  ('Python', 1, 'プログラミング言語', array['python']),
  ('TensorFlow', 3, '機械学習ライブラリ', array['tensorflow']),
  ('PyTorch', 3, '機械学習ライブラリ', array['pytorch']),
  ('Jupyter', 2, 'データ分析環境', array['jupyter']),
  ('NumPy', 2, '数値計算ライブラリ', array['numpy']);

-- セキュリティ関連の用語
insert into public.it_terms (term, difficulty_id, description, aliases) values
  ('HTTPS', 2, 'セキュアHTTP', array['https']),
  ('OAuth', 3, '認証フレームワーク', array['oauth']),
  ('JWT', 3, 'JSON Web Token', array['jwt']),
  ('SSL', 2, 'セキュリティプロトコル', array['ssl']),
  ('TLS', 3, 'セキュリティプロトコル', array['tls']);

-- インフラ・クラウド関連の用語
insert into public.it_terms (term, difficulty_id, description, aliases) values
  ('Docker', 2, 'コンテナ技術', array['docker']),
  ('Kubernetes', 4, 'コンテナオーケストレーション', array['k8s', 'K8s']),
  ('AWS', 2, 'クラウドサービス', array['aws']),
  ('Terraform', 3, 'インフラコード管理', array['terraform']),
  ('CI/CD', 3, '継続的インテグレーション', array['cicd']);

-- プログラミング言語関連の用語
insert into public.it_terms (term, difficulty_id, description, aliases) values
  ('Java', 2, 'プログラミング言語', array['java']),
  ('Go', 2, 'プログラミング言語', array['Golang', 'golang']),
  ('Rust', 3, 'プログラミング言語', array['rust']),
  ('Swift', 2, 'プログラミング言語', array['swift']),
  ('Kotlin', 2, 'プログラミング言語', array['kotlin']);
