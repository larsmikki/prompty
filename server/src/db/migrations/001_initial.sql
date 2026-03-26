CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO categories (id, name) VALUES ('general', 'General');
