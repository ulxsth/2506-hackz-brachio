-- =============================================
-- TYPE 2 LIVE - Seed Data
-- 多対多関係対応版
-- =============================================

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

-- =============================================
-- 多対多関係データ（it_term_categories）
-- =============================================

-- JavaScript: web + programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'JavaScript' and cat.name in ('web', 'programming');

-- TypeScript: web + programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'TypeScript' and cat.name in ('web', 'programming');

-- React: web
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'React' and cat.name = 'web';

-- Next.js: web + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Next.js' and cat.name in ('web', 'infrastructure');

-- HTML: web
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'HTML' and cat.name = 'web';

-- CSS: web
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'CSS' and cat.name = 'web';

-- Node.js: web + programming + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Node.js' and cat.name in ('web', 'programming', 'infrastructure');

-- SQL: database
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'SQL' and cat.name = 'database';

-- PostgreSQL: database + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'PostgreSQL' and cat.name in ('database', 'infrastructure');

-- MySQL: database + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'MySQL' and cat.name in ('database', 'infrastructure');

-- MongoDB: database + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'MongoDB' and cat.name in ('database', 'infrastructure');

-- Redis: database + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Redis' and cat.name in ('database', 'infrastructure');

-- Python: ai + programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Python' and cat.name in ('ai', 'programming');

-- TensorFlow: ai
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'TensorFlow' and cat.name = 'ai';

-- PyTorch: ai
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'PyTorch' and cat.name = 'ai';

-- Jupyter: ai + programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Jupyter' and cat.name in ('ai', 'programming');

-- NumPy: ai + programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'NumPy' and cat.name in ('ai', 'programming');

-- HTTPS: security + web
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'HTTPS' and cat.name in ('security', 'web');

-- OAuth: security + web
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'OAuth' and cat.name in ('security', 'web');

-- JWT: security + web
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'JWT' and cat.name in ('security', 'web');

-- SSL: security + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'SSL' and cat.name in ('security', 'infrastructure');

-- TLS: security + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'TLS' and cat.name in ('security', 'infrastructure');

-- Docker: infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Docker' and cat.name = 'infrastructure';

-- Kubernetes: infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Kubernetes' and cat.name = 'infrastructure';

-- AWS: infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'AWS' and cat.name = 'infrastructure';

-- Terraform: infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Terraform' and cat.name = 'infrastructure';

-- CI/CD: infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'CI/CD' and cat.name = 'infrastructure';

-- Java: programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Java' and cat.name = 'programming';

-- Go: programming + infrastructure
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Go' and cat.name in ('programming', 'infrastructure');

-- Rust: programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Rust' and cat.name = 'programming';

-- Swift: programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Swift' and cat.name = 'programming';

-- Kotlin: programming
insert into public.it_term_categories (it_term_id, category_id)
select it.id, cat.id 
from public.it_terms it, public.categories cat
where it.term = 'Kotlin' and cat.name = 'programming';
