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
  seed?: number; // Ranking / tournament seed (1 = highest)
  entryStage?: 'stage1' | 'stage2' | 'stage3';
  isUser: boolean;
  wins: number;
  losses: number;
  status: 'active' | 'qualified' | 'eliminated';
  roundRecords: { wins: number; losses: number }[]; // history by round
  mapProficiencies?: Record<string, number>; // 0 to 100
}

export type MatchFormat = 'BO1' | 'BO3' | 'BO5';

export interface VetoStep {
  type: 'ban' | 'pick';
  actor: 'user' | 'cpu';
  mapId: string;
  mapName: string;
}

export interface MapVetoState {
  currentTurn: 'user_ban' | 'cpu_ban' | 'user_pick' | 'cpu_pick' | 'completed';
  bannedMaps: string[];
  pickedMaps: string[]; // BO1: [decider], BO3: [p1, p2, decider], BO5: [p1, p2, p3, p4, decider]
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
  roundNumber: number; // 1 to 5 for Swiss, 1 to 3 for Playoffs
  team1Id: string;
  team2Id: string;
  format: MatchFormat;
  status: 'pending_veto' | 'live' | 'completed';
  veto?: MapVetoState;
  mapResults: MapGameResult[];
  winnerId?: string;
  loserId?: string;
  stage?: MajorStageId;
  bracketSlot?: 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'GF';
}

export interface SwissTournamentState {
  tournamentId: string;
  stageId?: 'stage1' | 'stage2' | 'stage3';
  seed: number;
  currentRound: number; // 1 to 5
  teams: TournamentTeam[];
  matchesByRound: Record<number, TournamentMatch[]>; // round -> matches
  completedMatches: TournamentMatch[];
  isCompleted: boolean;
  userStatus: 'active' | 'qualified' | 'eliminated';
}

export type MajorStageId = 'stage1' | 'stage2' | 'stage3' | 'playoffs';

export type MajorMachineState =
  | 'stage1_active'
  | 'stage1_complete'
  | 'stage2_active'
  | 'stage2_complete'
  | 'stage3_active'
  | 'stage3_complete'
  | 'playoffs_active'
  | 'tournament_complete';

export type PlayoffSeedingStrategy = 'high_vs_low' | 'avoid_rematch';

export interface PlayoffBracketMatch {
  slot: 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'SF1' | 'SF2' | 'GF';
  round: 'quarterfinals' | 'semifinals' | 'grand_final';
  format: 'BO3' | 'BO5';
  seed1?: number;
  seed2?: number;
  team1?: TournamentTeam;
  team2?: TournamentTeam;
  match?: TournamentMatch;
  nextSlot?: 'SF1' | 'SF2' | 'GF';
}

export interface PlayoffBracketState {
  seedingStrategy: PlayoffSeedingStrategy;
  seededTeams: TournamentTeam[]; // 8 qualified teams from Stage 3 in seed order (1..8)
  currentRound: 'quarterfinals' | 'semifinals' | 'grand_final' | 'completed';
  quarterfinals: PlayoffBracketMatch[]; // QF1, QF2, QF3, QF4
  semifinals: PlayoffBracketMatch[];    // SF1 (QF1vQF2), SF2 (QF3vQF4)
  grandFinal: PlayoffBracketMatch;      // GF (SF1vSF2)
  champion?: TournamentTeam;
  runnerUp?: TournamentTeam;
}

export interface StageEntryPoolsConfig {
  stage1TeamIds: string[]; // 15 opponent team IDs (plus user team = 16)
  stage2TeamIds: string[]; // 8 higher-ranked team IDs entering in Stage 2
  stage3TeamIds: string[]; // 8 highest-ranked team IDs entering in Stage 3
}

export interface MajorTournamentState {
  tournamentId: string;
  seed: number;
  machineState: MajorMachineState;
  activeStageId: MajorStageId;
  userTeamBase: TournamentTeam;
  entryPools: StageEntryPoolsConfig;
  allTeamTemplates: Record<string, TournamentTeam>;
  eliminatedTeamIds: string[];
  stages: {
    stage1: SwissTournamentState;
    stage2?: SwissTournamentState;
    stage3?: SwissTournamentState;
  };
  playoffs?: PlayoffBracketState;
  champion?: TournamentTeam;
  runnerUp?: TournamentTeam;
}
