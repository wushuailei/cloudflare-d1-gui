-- 示例数据库初始化脚本
-- 可以在 SQL 编辑器中执行此脚本来创建示例表和数据

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建文章表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入示例用户
INSERT INTO users (username, email) VALUES
  ('alice', 'alice@example.com'),
  ('bob', 'bob@example.com'),
  ('charlie', 'charlie@example.com');

-- 插入示例文章
INSERT INTO posts (user_id, title, content, published) VALUES
  (1, 'Hello World', 'This is my first post!', 1),
  (1, 'Learning D1', 'Cloudflare D1 is amazing!', 1),
  (2, 'Getting Started', 'A beginner guide to D1', 0),
  (3, 'Advanced Topics', 'Deep dive into D1 features', 1);

-- 插入示例评论
INSERT INTO comments (post_id, user_id, content) VALUES
  (1, 2, 'Great post!'),
  (1, 3, 'Thanks for sharing!'),
  (2, 2, 'Very informative'),
  (4, 1, 'Excellent article');

-- 查询示例
-- SELECT * FROM users;
-- SELECT * FROM posts WHERE published = 1;
-- SELECT p.title, u.username FROM posts p JOIN users u ON p.user_id = u.id;
