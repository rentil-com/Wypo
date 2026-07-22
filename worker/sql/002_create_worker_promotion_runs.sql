CREATE TABLE IF NOT EXISTS worker_promotion_runs (
  id BIGSERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  item_id BIGINT,
  item_name TEXT,
  old_price NUMERIC(12, 2),
  promotional_price NUMERIC(12, 2),
  discount_percent SMALLINT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMPTZ,
  CONSTRAINT chk_worker_promotion_runs_status
    CHECK (status IN ('success', 'skipped', 'error')),
  CONSTRAINT chk_worker_promotion_runs_discount
    CHECK (
      discount_percent IS NULL
      OR discount_percent BETWEEN 1 AND 99
    )
);

ALTER TABLE worker_promotion_runs
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_worker_promotion_runs_created_at
  ON worker_promotion_runs (created_at DESC, id DESC);
