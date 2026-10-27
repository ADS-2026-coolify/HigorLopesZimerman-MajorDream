-- Draft Arena PostgreSQL Schema Migrations

-- 1. Users Table (Cloud Profiles / Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Players Table (Normalized Verified Professional Records)
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(100) PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    real_name VARCHAR(150) NOT NULL,
    country VARCHAR(10) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    ovr INTEGER NOT NULL CHECK (ovr >= 50 AND ovr <= 99),
    era VARCHAR(20) NOT NULL,
    era_group VARCHAR(30) NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    hltv_rating NUMERIC(4,2),
    impact NUMERIC(4,2),
    adr NUMERIC(5,2),
    hs_percentage INTEGER,
    majors_won INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Historical Rosters & Teams
CREATE TABLE IF NOT EXISTS historical_teams (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    era VARCHAR(30) NOT NULL,
    logo_text VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Campaigns & Simulation Runs
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_name VARCHAR(100) NOT NULL,
    overall_ovr INTEGER NOT NULL,
    synergy_type VARCHAR(50) NOT NULL,
    user_wins INTEGER DEFAULT 0,
    user_losses INTEGER DEFAULT 0,
    is_champion BOOLEAN DEFAULT FALSE,
    is_invictus BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Campaign Matches History
CREATE TABLE IF NOT EXISTS simulated_matches (
    id VARCHAR(100) PRIMARY KEY,
    campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL,
    round_name VARCHAR(100) NOT NULL,
    map_name VARCHAR(50) NOT NULL,
    opponent_name VARCHAR(100) NOT NULL,
    user_score INTEGER NOT NULL,
    opponent_score INTEGER NOT NULL,
    won BOOLEAN NOT NULL,
    mvp_nickname VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);
CREATE INDEX IF NOT EXISTS idx_players_era ON players(era_group);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
