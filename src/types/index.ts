export type Role = 'igl' | 'awp' | 'entry' | 'rifler' | 'lurker' | 'support';
export type Era = '1.6' | 'Source' | '2013-2016' | '2017-2019' | '2020-2022' | 'CS2';

export interface Player {
  id: string;             // e.g. "coldzera-2016"
  nickname: string;       // "coldzera"
  realName: string;       // "Marcelo David"
  country: string;        // "BR", "UA", "DK", "FR", "BA", etc.
  countryName: string;    // "Brasil"
  role: Role;
  ovr: number;            // 60-99
  era: string;            // "2016"
  eraGroup: Era;
  teamId: string;         // "luminosity-2016"
  teamName: string;       // "Luminosity Gaming"
  note?: string;          // e.g. "MVP MLG Columbus 2016, #1 HLTV"
  avatarUrl?: string;     // photo / avatar representation
  stats: {
    rating: number;       // e.g. 1.28
    impact: number;       // e.g. 1.34
    adr: number;          // e.g. 88.5
    hsPercentage: number; // e.g. 51
    clutchRating?: number;// e.g. 88
    majorsWon?: number;   // e.g. 2
  };
}

export interface HistoricalTeam {
  id: string;             // "luminosity-2016"
  name: string;           // "Luminosity Gaming"
  year: number;           // 2016
  era: Era;
  logoText: string;       // "LG"
  accentColor: string;    // "#00A3E0"
  roster: Player[];
  description?: string;
  majorTrophies?: string[];
}

export interface MapData {
  id: string;
  name: string;
  activeDuty: boolean;
  imageBg: string;
}

export interface DraftSlot {
  slotNumber: number;     // 1 to 5
  player: Player | null;
}

export type SynergyType = 'full' | 'no_lurker' | 'no_igl' | 'broken' | 'neutral';

export interface SynergyResult {
  type: SynergyType;
  scoreBonus: number;     // e.g. +3, 0, -2, -5
  labelKey: string;
  descriptionKey: string;
}

export interface SimulationRoundResult {
  roundNumber: number;
  winner: 'user' | 'opponent';
  userRoundScore: number;
  opponentRoundScore: number;
  highlightText: string;
  isPistol?: boolean;
}

export interface SimulatedMatchResult {
  id: string;
  stage: 'swiss' | 'playoff';
  roundName: string;       // "Rodada 1 (0-0)" or "Quartas de Final"
  mapName: string;
  opponentTeam: {
    name: string;
    ovr: number;
    logoText: string;
    roster: Player[];
  };
  userScore: number;
  opponentScore: number;
  isOvertime: boolean;
  won: boolean;
  mvp: {
    nickname: string;
    team: 'user' | 'opponent';
    kd: string;
    rating: number;
  };
  playerPerformances: {
    playerId: string;
    nickname: string;
    kills: number;
    deaths: number;
    assists: number;
    rating: number;
    isMvp: boolean;
  }[];
  roundsHistory: SimulationRoundResult[];
}

export interface CampaignState {
  campaignId: string;
  teamName: string;
  lineup: Player[];
  overallOvr: number;
  synergy: SynergyResult;
  mapPoints: Record<string, number>;
  // Swiss Stage: 16 teams, swiss rounds
  swissRound: number;
  userWins: number;
  userLosses: number;
  swissMatches: SimulatedMatchResult[];
  isSwissFinished: boolean;
  isQualifiedForPlayoffs: boolean;
  // Playoff Stage: Bo3
  playoffStage: 'quarters' | 'semis' | 'finals' | 'champion' | 'eliminated' | 'none';
  playoffMatches: SimulatedMatchResult[];
  isChampion: boolean;
  isInvictus: boolean;
  majorMvp: Player | null;
  status: 'drafting' | 'map_allocation' | 'swiss' | 'playoffs' | 'completed';
}

export interface BingoCell {
  id: string;
  condition: string;
  conditionDescription: string;
  filled: boolean;
  assignedPlayer?: Player;
  check: (player: Player) => boolean;
}

export interface GuessChallenge {
  date: string;
  targetPlayer: Player;
  maxAttempts: number;
  attempts: {
    player: Player;
    matchingFields: {
      team: boolean;
      country: boolean;
      role: boolean;
      era: 'higher' | 'lower' | 'equal';
      ovr: 'higher' | 'lower' | 'equal';
      rating: 'higher' | 'lower' | 'equal';
    };
  }[];
  isComplete: boolean;
  isWon: boolean;
}
