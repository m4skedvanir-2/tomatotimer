CREATE TABLE IF NOT EXISTS workspaces (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR NOT NULL UNIQUE,
    access_token VARCHAR NOT NULL,
    bot_token VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timers (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    channel_id VARCHAR NOT NULL,
    focus_min INTEGER NOT NULL,
    break_min INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR NOT NULL DEFAULT 'focus',
    prev_status_text VARCHAR,
    prev_status_emoji VARCHAR
);

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    custom_status_text VARCHAR,
    user_token VARCHAR,
    UNIQUE(team_id, user_id)
);