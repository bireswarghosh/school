-- 005_uploaded_files.sql — Serverless-safe file storage.
-- Vercel's filesystem is read-only/ephemeral, so uploads are stored in Postgres.
CREATE TABLE IF NOT EXISTS uploaded_files (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  data BYTEA NOT NULL,
  school_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_school ON uploaded_files(school_id);
