-- Database is automatically created from POSTGRES_DB environment variable
-- No need to create database manually since PostgreSQL container handles this

-- Tyhjennetään vanhat taulut oikeassa riippuvuusjärjestyksessä
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS app_sessions;
DROP TABLE IF EXISTS app_users;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS test;

-- Testitaulu
CREATE TABLE IF NOT EXISTS test (
    id SERIAL PRIMARY KEY,
    description TEXT
);

INSERT INTO test (description) VALUES ('bar'), ('baz'), ('qux');

-- Käyttäjät
CREATE TABLE IF NOT EXISTS app_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessiot
CREATE TABLE IF NOT EXISTS app_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suosikit
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL,
    movie_title VARCHAR(255),
    poster_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, movie_id)
);