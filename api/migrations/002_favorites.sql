CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL,
    movie_title VARCHAR(255),
    poster_path VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT favorites_account_movie_unique UNIQUE(account_id, movie_id)
);

CREATE INDEX IF NOT EXISTS favorites_account_idx ON favorites (account_id);