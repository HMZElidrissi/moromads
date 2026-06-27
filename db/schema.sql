CREATE TABLE IF NOT EXISTS spots (
  id          INTEGER PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  city        TEXT NOT NULL,
  address     TEXT NOT NULL,
  maps_url    TEXT NOT NULL,
  wifi_mbps   REAL NOT NULL,
  wifi_speed_label  TEXT NOT NULL,
  noise_level       TEXT NOT NULL,
  noise_score_label TEXT NOT NULL,
  comfort_score       REAL NOT NULL,
  comfort_score_label TEXT NOT NULL,
  espresso_price  REAL,
  price_range     TEXT NOT NULL,
  timing          TEXT,
  outlets_label   TEXT NOT NULL,
  tpe            INTEGER,   -- 1 = true, 0 = false, NULL = unknown
  non_smoking    INTEGER,   -- 1 = true, 0 = false, NULL = unknown
  air_conditioned INTEGER,  -- 1 = true, 0 = false, NULL = unknown
  rating        REAL NOT NULL,
  review_count  INTEGER NOT NULL,
  gradient      TEXT NOT NULL,
  images        TEXT NOT NULL DEFAULT '[]',  -- JSON array
  tags          TEXT NOT NULL DEFAULT '[]'   -- JSON array
);

CREATE INDEX IF NOT EXISTS idx_spots_city ON spots (city);
CREATE INDEX IF NOT EXISTS idx_spots_slug ON spots (slug);

CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_slug     TEXT    NOT NULL,
  wifi_score    INTEGER NOT NULL CHECK(wifi_score    BETWEEN 1 AND 5),
  noise_score   INTEGER NOT NULL CHECK(noise_score   BETWEEN 1 AND 5),
  comfort_score INTEGER NOT NULL CHECK(comfort_score BETWEEN 1 AND 5),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_spot_slug ON reviews (spot_slug);

CREATE TABLE IF NOT EXISTS spot_submissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK(type IN ('café', 'coworking')),
  city            TEXT NOT NULL,
  address         TEXT NOT NULL,
  maps_url        TEXT,
  wifi_mbps       REAL,
  timing          TEXT,
  espresso_price  REAL,
  price_range     TEXT,
  tpe             INTEGER,
  non_smoking     INTEGER,
  air_conditioned INTEGER,
  notes           TEXT,
  submitter_email TEXT,
  images          TEXT NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending', 'approved', 'rejected')),
  submitted_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON spot_submissions (status);

CREATE TABLE IF NOT EXISTS admin_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TEXT,
  last_login_at       TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions (user_id);
