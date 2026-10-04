CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    review_text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT reviews_account_movie_unique UNIQUE(account_id, movie_id)
);

CREATE INDEX IF NOT EXISTS reviews_movie_idx ON reviews (movie_id);

CREATE INDEX IF NOT EXISTS reviews_account_idx ON reviews (account_id);