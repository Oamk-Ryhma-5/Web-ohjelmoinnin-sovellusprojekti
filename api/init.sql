-- Database is automatically created from POSTGRES_DB environment variable
-- No need to create database manually since PostgreSQL container handles this

-- Tyhjennetään vanhat taulut oikeassa riippuvuusjärjestyksessä
DROP TABLE IF EXISTS group_movies;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
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

-- Valmis testikäyttäjä (Aito scrypt-tiiviste)
-- Kirjautumistiedot: test@user.com / Testi123!
INSERT INTO app_users (username, email, password_hash) 
VALUES (
    'TestUser', 
    'test@user.com', 
    'scrypt$318a22a290c2c5019de2aceb67a52218$77d79a484aaf9abb57c7ee4a3d630b411c2eb18218bd8c267747c464b7066a85e841472fe60777c2fa4b49397e3a001cfdc1161e3d755600e83a97f28fc0569f'
) ON CONFLICT (email) DO NOTHING;

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

-- Ryhmät
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id INT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ryhmän jäsenet ja liittymispyynnöt (Vaatimukset 8 & 9)
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' tai 'accepted'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Ryhmän elokuvat / kustomointi (Vaatimus 10)
CREATE TABLE IF NOT EXISTS group_movies (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    movie_id VARCHAR(100) NOT NULL,
    movie_title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    added_by INT REFERENCES app_users(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, movie_id)
);

-- Esimerkkiryhmä ja omistajan automaattinen jäsenyys
INSERT INTO groups (id, name, owner_id) VALUES (1, 'Sci-Fi Leffakerho', 1) ON CONFLICT DO NOTHING;
INSERT INTO group_members (group_id, user_id, status) VALUES (1, 1, 'accepted') ON CONFLICT DO NOTHING;