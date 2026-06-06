CREATE TABLE IF NOT EXISTS wishlists (
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS wishlists_user_created_at_idx
  ON wishlists (user_id, created_at DESC);
