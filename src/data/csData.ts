import { HistoricalTeam, MapData } from '../types';
import { CS_DATABASE, ALL_DATABASE_PLAYERS } from './csDatabase';

export const ACTIVE_MAPS: MapData[] = [
  { id: 'mirage', name: 'Mirage', activeDuty: true, imageBg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
  { id: 'inferno', name: 'Inferno', activeDuty: true, imageBg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
  { id: 'nuke', name: 'Nuke', activeDuty: true, imageBg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80' },
  { id: 'dust2', name: 'Dust II', activeDuty: true, imageBg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
  { id: 'ancient', name: 'Ancient', activeDuty: true, imageBg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
  { id: 'anubis', name: 'Anubis', activeDuty: true, imageBg: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
  { id: 'overpass', name: 'Overpass', activeDuty: false, imageBg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
];

/**
 * 32 Distinct Professional CS Teams with verified historical rosters
 */
export const HISTORICAL_TEAMS: HistoricalTeam[] = CS_DATABASE;

// Flat list of all players for quick lookup, guessing game, bingo, etc.
export const ALL_PLAYERS = ALL_DATABASE_PLAYERS;
