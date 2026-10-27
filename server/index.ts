import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HISTORICAL_TEAMS, ALL_PLAYERS, ACTIVE_MAPS } from './data/csData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Health check & API documentation endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    product: 'Draft Arena API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. All Historical Teams & Rosters
app.get('/api/teams', (_req: Request, res: Response) => {
  res.json({
    total: HISTORICAL_TEAMS.length,
    teams: HISTORICAL_TEAMS
  });
});

// 3. Search and Filter Players
app.get('/api/players', (req: Request, res: Response) => {
  const { query, role, era } = req.query;
  let results = [...ALL_PLAYERS];

  if (typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(p => 
      p.nickname.toLowerCase().includes(q) || 
      p.realName.toLowerCase().includes(q) ||
      p.teamName.toLowerCase().includes(q)
    );
  }

  if (typeof role === 'string' && role !== 'all') {
    results = results.filter(p => p.role === role);
  }

  if (typeof era === 'string' && era !== 'all') {
    results = results.filter(p => p.eraGroup === era);
  }

  res.json({
    total: results.length,
    players: results
  });
});

// 4. Daily Secret Guess Player endpoint (Deterministic)
app.get('/api/daily-pro', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % ALL_PLAYERS.length;
  const target = ALL_PLAYERS[idx];

  res.json({
    date: today,
    targetId: target.id,
    era: target.era,
    role: target.role,
    country: target.country
  });
});

// 5. Active Duty Maps
app.get('/api/maps', (_req: Request, res: Response) => {
  res.json({
    maps: ACTIVE_MAPS
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Draft Arena Backend] Running on http://localhost:${PORT}`);
  });
}

export default app;
