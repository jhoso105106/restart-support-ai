PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '匿名ユーザー',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (length(comment) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question TEXT NOT NULL CHECK (length(question) BETWEEN 1 AND 4000),
  answer TEXT NOT NULL CHECK (length(answer) BETWEEN 1 AND 10000),
  score INTEGER CHECK (score BETWEEN 0 AND 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS counseling_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  consultation TEXT NOT NULL CHECK (length(consultation) BETWEEN 1 AND 4000),
  advice TEXT NOT NULL CHECK (length(advice) BETWEEN 1 AND 10000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_created
  ON mood_logs(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_interview_history_user_created
  ON interview_history(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_counseling_history_user_created
  ON counseling_history(user_id, created_at DESC, id DESC);
