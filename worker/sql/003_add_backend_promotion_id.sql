ALTER TABLE worker_promotion_runs
  ADD COLUMN IF NOT EXISTS backend_promotion_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_worker_promotion_runs_backend_promotion_id
  ON worker_promotion_runs (backend_promotion_id);
