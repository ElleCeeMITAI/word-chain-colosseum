-- Run once via Neon console or migration script

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  score INTEGER DEFAULT 0,
  words_submitted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chain_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL,
  agent_id UUID REFERENCES agents(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  chain_id INTEGER NOT NULL DEFAULT 1
);

-- Single-row state table for current chain
CREATE TABLE chain_meta (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_chain_id INTEGER DEFAULT 1,
  chain_length INTEGER DEFAULT 0,
  last_word VARCHAR(100) DEFAULT 'start',
  last_submitted_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO chain_meta (id) VALUES (1);
