import { Player } from './index';

export interface TournamentTeam {
  id: string; // 'user-team' or historical team id
  name: string;
  shortName: string;
  year?: number;
  logoText: string;
  accentColor: string;
  roster: Player[];
  ovr: number;
  isUser: boolean;
  wins: number;
  losses: number;
  status: 'active' | 'qualified' | 'eliminated';
  roundRecords: { wins: number; losses: number }[]; // history by round
  mapProficiencies?: Record<string, number>; // 0 to 100
}

export type MatchFormat = 'BO1' | 'BO3';

export interface VetoStep {
  type: 'ban' | 'pick';
  actor: 'user' | 'cpu';
  mapId: string;
  mapName: string;
}

export interface MapVetoState {
  currentTurn: 'user_ban' | 'cpu_ban' | 'user_pick' | 'cpu_pick' | 'completed';
  bannedMaps: string[];
  pickedMaps: string[]; // for BO3: [userPick, cpuPick, decider]
  deciderMap?: string;
  history: VetoStep[];
  format: MatchFormat;
}

export interface RoundEvent {
  roundNumber: number;
  winner: 'user' | 'opponent';
  userScore: number;
  opponentScore: number;
  highlightText: string;
  isPistol?: boolean;
  phase: 'regulation' | 'overtime';
  overtimeBlock?: number; // 1 for OT1 (13-18 OT rounds), 2 for OT2, etc.
  userSide: 'CT' | 'T';
  opponentSide: 'CT' | 'T';
  playerRoundRatings?: Record<string, number>;
  playerAverageRatings?: Record<string, number>;
}

export interface MapGameResult {
  mapId: string;
  mapName: string;
  userScore: number;
  opponentScore: number;
  winner: 'user' | 'opponent';
  isOvertime: boolean;
  overtimeCount: number;
  rounds: RoundEvent[];
}

export interface TournamentMatch {
  id: string;
  roundNumber: number; // 1 to 5
  team1Id: string;
  team2Id: string;
  format: MatchFormat;
  status: 'pending_veto' | 'live' | 'completed';
  veto?: MapVetoState;
  mapResults: MapGameResult[];
  winnerId?: string;
  loserId?: string;
}

export interface SwissTournamentState {
  tournamentId: string;
  seed: number;
  currentRound: number; // 1 to 5
  teams: TournamentTeam[];
  matchesByRound: Record<number, TournamentMatch[]>; // round -> matches
  completedMatches: TournamentMatch[];
  isCompleted: boolean;
  userStatus: 'active' | 'qualified' | 'eliminated';
}
