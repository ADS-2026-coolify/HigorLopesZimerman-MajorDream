import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HISTORICAL_TEAMS, ALL_PLAYERS, ACTIVE_MAPS } from '../src/data/csData';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '../dist');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'online', product: 'Major Dream API', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/teams', (_req: Request, res: Response) => {
  res.json({ total: HISTORICAL_TEAMS.length, teams: HISTORICAL_TEAMS });
});

app.get('/api/players', (req: Request, res: Response) => {
  const { query, role, era } = req.query;
  let results = [...ALL_PLAYERS];
  if (typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(p => p.nickname.toLowerCase().includes(q) || p.realName.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q));
  }
  if (typeof role === 'string' && role !== 'all') results = results.filter(p => p.role === role);
  if (typeof era === 'string' && era !== 'all') results = results.filter(p => p.eraGroup === era);
  res.json({ total: results.length, players: results });
});

app.get('/api/daily-pro', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) { hash = (hash << 5) - hash + today.charCodeAt(i); hash |= 0; }
  const target = ALL_PLAYERS[Math.abs(hash) % ALL_PLAYERS.length];
  res.json({ date: today, targetId: target.id, era: target.era, role: target.role, country: target.country });
});

app.get('/api/maps', (_req: Request, res: Response) => { res.json({ maps: ACTIVE_MAPS }); });

// Serve the compiled React/Vite application from the same origin as the API.
app.use(express.static(distDir));
app.get(/^(?!\/api\/).*/, (_req: Request, res: Response) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => console.log('[Major Dream] Frontend and API listening on ' + HOST + ':' + PORT));
}

export default app;
