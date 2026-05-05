-- Initial schema for Cloudflare D1
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('total_daily_limit', '100');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ip_daily_limit', '3');
INSERT OR IGNORE INTO settings (key, value) VALUES ('custom_api_key', '');

CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT,
  ip_location TEXT,
  lat REAL,
  lon REAL,
  name TEXT,
  gender TEXT DEFAULT '未知',
  calendar_type TEXT,
  birth_date TEXT,
  birth_time TEXT,
  province TEXT,
  result_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT,
  user_identifier TEXT,
  location TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS banned_ips (
  ip TEXT PRIMARY KEY,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT,
  user_identifier TEXT,
  usage_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  quota_date DATE DEFAULT (date('now')),
  UNIQUE(ip, user_identifier, quota_date)
);
