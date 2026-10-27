import { Player } from '../types';
import { ACTIVE_MAPS, HISTORICAL_TEAMS } from '../data/csData';
import {
  TournamentTeam,
  TournamentMatch,
  SwissTournamentState,
  MatchFormat,
  MapVetoState,
  MapGameResult,
  RoundEvent,
  VetoStep
} from '../types/tournament';

// 8 Competitive Maps matching reference screenshot: Dust2, Mirage, Train, Cache, Nuke, Overpass, Inferno, Anubis, Ancient
export interface MapMeta {
  id: string;
  name: string;
  thumbnail: string;
}

export const TOURNAMENT_MAPS: MapMeta[] = [
  { id: 'mirage', name: 'Mirage', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
  { id: 'inferno', name: 'Inferno', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
  { id: 'nuke', name: 'Nuke', thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80' },
  { id: 'dust2', name: 'Dust2', thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
  { id: 'ancient', name: 'Ancient', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' },
  { id: 'anubis', name: 'Anubis', thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
  { id: 'overpass', name: 'Overpass', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
];

// Additional opponent profiles to guarantee 15 unique opponents alongside user team
const ADDITIONAL_OPPONENTS: Array<{ id: string; name: string; shortName: string; year: number; logoText: string; accentColor: string; ovr: number }> = [
  { id: 'furia-2019', name: "FURIA '19", shortName: 'FURIA', year: 2019, logoText: 'FUR', accentColor: '#000000', ovr: 88 },
  { id: 'renegades-2019', name: "Renegades '19", shortName: 'RNG', year: 2019, logoText: 'RNG', accentColor: '#8B0000', ovr: 85 },
  { id: 'nrg-2019', name: "NRG '19", shortName: 'NRG', year: 2019, logoText: 'NRG', accentColor: '#EF4444', ovr: 87 },
  { id: 'copenhagen-2014', name: "CPH Wolves '14", shortName: 'CPHW', year: 2014, logoText: 'CW', accentColor: '#EAB308', ovr: 84 },
  { id: 'clg-2015', name: "CLG '15", shortName: 'CLG', year: 2015, logoText: 'CLG', accentColor: '#00A3E0', ovr: 83 },
];

/**
 * Deterministic PRNG using LCG algorithm
 */
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Derive user team's map proficiency from allocated map points
 * Formula: Base 40% + (mapPoints * 6%), clamped 25% - 98%
 */
export function getUserMapProficiency(mapId: string, mapPoints: Record<string, number>): number {
  const points = mapPoints[mapId] || 0;
  // Natural variation per map so maps aren't all identical without points
  const baseMapBonus: Record<string, number> = {
    mirage: 6,
    dust2: 5,
    inferno: 3,
    nuke: 4,
    train: 4,
    cache: 1,
    overpass: -3,
    ancient: -3,
    anubis: 5
  };
  const base = 40 + (baseMapBonus[mapId] || 0);
  const total = base + (points * 6);
  return Math.min(98, Math.max(25, total));
}

/**
 * Deterministic opponent map proficiency based on teamId & seed
 */
export function getOpponentMapProficiency(teamId: string, mapId: string, seed: number): number {
  let hash = 0;
  const str = `${teamId}_${mapId}_${seed % 997}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 45); // 0 to 44
  return 28 + normalized; // 28% to 72%
}

/**
 * Determine match format according to Swiss record rules:
 * BO1: 0-0, 1-0, 0-1, 1-1
 * BO3: 0-2, 2-0, 1-2, 2-1, 2-2 (all advancement & elimination matches)
 */
export function getMatchFormat(wins: number, losses: number): MatchFormat {
  if (
    (wins === 0 && losses === 2) ||
    (wins === 2 && losses === 0) ||
    (wins === 1 && losses === 2) ||
    (wins === 2 && losses === 1) ||
    (wins === 2 && losses === 2)
  ) {
    return 'BO3';
  }
  return 'BO1';
}

/**
 * Build 16-team pool containing the user team + 15 opponents
 */
export function initialize16Teams(
  userTeamName: string,
  userLineup: Player[],
  userOvr: number,
  mapPoints: Record<string, number>,
  seed: number = 42
): TournamentTeam[] {
  const userTeam: TournamentTeam = {
    id: 'user-team',
    name: userTeamName || 'Meu Time',
    shortName: (userTeamName || 'USER').slice(0, 8),
    logoText: (userTeamName || 'CS').slice(0, 2).toUpperCase(),
    accentColor: '#10B981',
    roster: userLineup,
    ovr: userOvr,
    isUser: true,
    wins: 0,
    losses: 0,
    status: 'active',
    roundRecords: [{ wins: 0, losses: 0 }]
  };

  const opponents: TournamentTeam[] = [];

  // Add historical teams
  HISTORICAL_TEAMS.forEach(ht => {
    if (opponents.length >= 15) return;
    const avgOvr = Math.round(ht.roster.reduce((acc, p) => acc + p.ovr, 0) / (ht.roster.length || 1));
    opponents.push({
      id: ht.id,
      name: `${ht.name} '${String(ht.year).slice(-2)}`,
      shortName: ht.logoText || ht.name.slice(0, 6),
      year: ht.year,
      logoText: ht.logoText,
      accentColor: ht.accentColor,
      roster: ht.roster,
      ovr: avgOvr,
      isUser: false,
      wins: 0,
      losses: 0,
      status: 'active',
      roundRecords: [{ wins: 0, losses: 0 }]
    });
  });

  // If we still need more to reach 15, pull from additional opponents
  ADDITIONAL_OPPONENTS.forEach(ao => {
    if (opponents.length >= 15) return;
    opponents.push({
      id: ao.id,
      name: ao.name,
      shortName: ao.shortName,
      year: ao.year,
      logoText: ao.logoText,
      accentColor: ao.accentColor,
      roster: [],
      ovr: ao.ovr,
      isUser: false,
      wins: 0,
      losses: 0,
      status: 'active',
      roundRecords: [{ wins: 0, losses: 0 }]
    });
  });

  // Calculate map proficiencies for opponents
  opponents.forEach(opp => {
    opp.mapProficiencies = {};
    TOURNAMENT_MAPS.forEach(m => {
      opp.mapProficiencies![m.id] = getOpponentMapProficiency(opp.id, m.id, seed);
    });
  });

  // User map proficiencies
  userTeam.mapProficiencies = {};
  TOURNAMENT_MAPS.forEach(m => {
    userTeam.mapProficiencies![m.id] = getUserMapProficiency(m.id, mapPoints);
  });

  return [userTeam, ...opponents.slice(0, 15)];
}

/**
 * Generate Swiss Pairings for the current round
 * - Group active teams by (wins, losses)
 * - Pair within the same record group
 * - Prevent repeat rematches across the tournament
 * - Never pair user team with itself
 * - If group has odd count, float 1 team to neighbor group
 */
export function generateSwissPairings(
  teams: TournamentTeam[],
  pastMatches: TournamentMatch[],
  roundNumber: number,
  seed: number
): TournamentMatch[] {
  const activeTeams = teams.filter(t => t.status === 'active');
  const pastPairs = new Set<string>();
  pastMatches.forEach(m => {
    pastPairs.add(`${m.team1Id}_${m.team2Id}`);
    pastPairs.add(`${m.team2Id}_${m.team1Id}`);
  });

  // Group teams by "wins-losses"
  const groups: Record<string, TournamentTeam[]> = {};
  activeTeams.forEach(t => {
    const key = `${t.wins}-${t.losses}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const pairings: TournamentMatch[] = [];
  const assigned = new Set<string>();
  const rng = seededRandom(seed + roundNumber * 7919);

  // Sort group keys in standard order (e.g. 2-0, 1-1, 0-2)
  const groupKeys = Object.keys(groups).sort((a, b) => {
    const [wA, lA] = a.split('-').map(Number);
    const [wB, lB] = b.split('-').map(Number);
    if (wA !== wB) return wB - wA;
    return lA - lB;
  });

  let floatingTeam: TournamentTeam | null = null;

  for (const key of groupKeys) {
    let pool = [...groups[key].filter(t => !assigned.has(t.id))];

    if (floatingTeam) {
      pool.unshift(floatingTeam);
      floatingTeam = null;
    }

    // Shuffle pool deterministically
    pool.sort(() => rng() - 0.5);

    // If pool has odd number of teams and not the last group, float the last one
    if (pool.length % 2 !== 0 && groupKeys.indexOf(key) < groupKeys.length - 1) {
      floatingTeam = pool.pop()!;
    }

    // Pair greedily avoiding rematches
    while (pool.length >= 2) {
      const teamA = pool.shift()!;
      let partnerIndex = -1;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        if (!pastPairs.has(`${teamA.id}_${candidate.id}`)) {
          partnerIndex = i;
          break;
        }
      }

      // If no candidate avoids rematch, pick the first
      if (partnerIndex === -1) {
        partnerIndex = 0;
      }

      const teamB = pool.splice(partnerIndex, 1)[0];
      assigned.add(teamA.id);
      assigned.add(teamB.id);

      // Match format derived from record
      const format = getMatchFormat(teamA.wins, teamA.losses);

      // Always put user team as team1 if present for convenient UI
      const [t1, t2] = teamB.isUser ? [teamB, teamA] : [teamA, teamB];

      pairings.push({
        id: `match_r${roundNumber}_${t1.id}_vs_${t2.id}`,
        roundNumber,
        team1Id: t1.id,
        team2Id: t2.id,
        format,
        status: 'pending_veto',
        mapResults: []
      });
    }

    if (pool.length === 1 && !floatingTeam) {
      floatingTeam = pool.pop()!;
    }
  }

  // If one team remains floating at the end, pair with the least-recently matched
  if (floatingTeam && pairings.length > 0) {
    // Edge-case safety fallback
    const unpaired = activeTeams.filter(t => !assigned.has(t.id));
    if (unpaired.length === 2) {
      const format = getMatchFormat(unpaired[0].wins, unpaired[0].losses);
      pairings.push({
        id: `match_r${roundNumber}_${unpaired[0].id}_vs_${unpaired[1].id}`,
        roundNumber,
        team1Id: unpaired[0].id,
        team2Id: unpaired[1].id,
        format,
        status: 'pending_veto',
        mapResults: []
      });
    }
  }

  return pairings;
}

/**
 * CPU Strategic Map Pick/Ban Decision Engine
 * Unit-testable & purely deterministic
 */
export function computeCpuVetoChoice(
  actionType: 'ban' | 'pick',
  availableMapIds: string[],
  cpuProficiencies: Record<string, number>,
  userProficiencies: Record<string, number>
): string {
  if (availableMapIds.length === 0) return '';
  if (availableMapIds.length === 1) return availableMapIds[0];

  if (actionType === 'ban') {
    // Ban the map where USER advantage is largest: (userProf - cpuProf) is maximized
    let worstMap = availableMapIds[0];
    let maxUserAdvantage = -999;

    for (const mapId of availableMapIds) {
      const uProf = userProficiencies[mapId] ?? 50;
      const cProf = cpuProficiencies[mapId] ?? 50;
      const advantage = uProf - cProf;
      if (advantage > maxUserAdvantage) {
        maxUserAdvantage = advantage;
        worstMap = mapId;
      }
    }
    return worstMap;
  } else {
    // Pick the map where CPU advantage is largest: (cpuProf - userProf) is maximized
    let bestMap = availableMapIds[0];
    let maxCpuAdvantage = -999;

    for (const mapId of availableMapIds) {
      const uProf = userProficiencies[mapId] ?? 50;
      const cProf = cpuProficiencies[mapId] ?? 50;
      const advantage = cProf - uProf;
      if (advantage > maxCpuAdvantage) {
        maxCpuAdvantage = advantage;
        bestMap = mapId;
      }
    }
    return bestMap;
  }
}

export type VetoActionType = 'ban' | 'pick';
export type VetoActor = 'user' | 'cpu';

export interface VetoStepDefinition {
  stepIndex: number;
  actor: VetoActor;
  action: VetoActionType;
  description: string;
}

/**
 * Exact BO3 Veto Sequence for 7-map pool:
 * Step 1: P1 (User) bans one map
 * Step 2: P2 (CPU) bans one map
 * Step 3: P1 (User) picks map 1
 * Step 4: P2 (CPU) picks map 2
 * Step 5: P1 (User) bans one map
 * Step 6: P2 (CPU) bans one map
 * Step 7: Automatic decider (only 1 remaining map) -> assigned as map 3
 */
export const BO3_SEVEN_MAP_SEQUENCE: VetoStepDefinition[] = [
  { stepIndex: 0, actor: 'user', action: 'ban', description: 'P1 (Você) bane um mapa' },
  { stepIndex: 1, actor: 'cpu', action: 'ban', description: 'P2 (CPU) bane um mapa' },
  { stepIndex: 2, actor: 'user', action: 'pick', description: 'P1 (Você) escolhe o Mapa 1' },
  { stepIndex: 3, actor: 'cpu', action: 'pick', description: 'P2 (CPU) escolhe o Mapa 2' },
  { stepIndex: 4, actor: 'user', action: 'ban', description: 'P1 (Você) bane um mapa' },
  { stepIndex: 5, actor: 'cpu', action: 'ban', description: 'P2 (CPU) bane um mapa' },
];

/**
 * Pure transition function for BO1 and BO3 Veto State Machine
 */
export function transitionVetoState(
  currentState: MapVetoState,
  actionMapId: string,
  actionMapName: string,
  mapPool: MapMeta[] = TOURNAMENT_MAPS
): MapVetoState {
  const { format, bannedMaps, pickedMaps, history } = currentState;
  const currentStepDef = getExpectedVetoStep(format, history.length, mapPool.length);

  if (!currentStepDef) {
    throw new Error('Veto is already completed or invalid step');
  }

  // Validate map legality
  if (bannedMaps.includes(actionMapId)) {
    throw new Error(`Map ${actionMapId} is already banned`);
  }
  if (pickedMaps.includes(actionMapId)) {
    throw new Error(`Map ${actionMapId} is already picked`);
  }

  const newBanned = currentStepDef.action === 'ban' ? [...bannedMaps, actionMapId] : [...bannedMaps];
  const newPicked = currentStepDef.action === 'pick' ? [...pickedMaps, actionMapId] : [...pickedMaps];
  const newHistory: VetoStep[] = [
    ...history,
    {
      type: currentStepDef.action,
      actor: currentStepDef.actor,
      mapId: actionMapId,
      mapName: actionMapName
    }
  ];

  const remainingMaps = mapPool.filter(
    m => !newBanned.includes(m.id) && !newPicked.includes(m.id)
  );

  let nextTurn: MapVetoState['currentTurn'] = 'completed';
  let finalPickedMaps = [...newPicked];
  let decider: string | undefined = undefined;

  if (format === 'BO1') {
    if (remainingMaps.length === 1) {
      // Exactly 1 map remaining -> match decider map
      finalPickedMaps = [remainingMaps[0].id];
      decider = remainingMaps[0].id;
      nextTurn = 'completed';
    } else if (remainingMaps.length > 1) {
      const nextActor: VetoActor = currentStepDef.actor === 'user' ? 'cpu' : 'user';
      nextTurn = nextActor === 'user' ? 'user_ban' : 'cpu_ban';
    }
  } else {
    // BO3 (7 maps pool):
    // After 6 steps (2 bans, 2 picks, 2 bans), exactly 1 map remains.
    // It is automatically assigned as map 3 (decider) without another pick.
    if (newHistory.length === 6 || remainingMaps.length === 1) {
      const deciderMap = remainingMaps[0];
      finalPickedMaps = [...newPicked, deciderMap.id];
      decider = deciderMap.id;
      nextTurn = 'completed';
    } else {
      const nextStepDef = BO3_SEVEN_MAP_SEQUENCE[newHistory.length];
      if (nextStepDef) {
        if (nextStepDef.action === 'ban') {
          nextTurn = nextStepDef.actor === 'user' ? 'user_ban' : 'cpu_ban';
        } else {
          nextTurn = nextStepDef.actor === 'user' ? 'user_pick' : 'cpu_pick';
        }
      }
    }
  }

  return {
    format,
    bannedMaps: newBanned,
    pickedMaps: finalPickedMaps,
    deciderMap: decider,
    history: newHistory,
    currentTurn: nextTurn
  };
}

/**
 * Get expected veto step definition given format and current history length
 */
export function getExpectedVetoStep(
  format: MatchFormat,
  historyCount: number,
  mapPoolSize: number = 7
): VetoStepDefinition | null {
  if (format === 'BO1') {
    // BO1 bans until 1 map remains (mapPoolSize - 1 bans)
    if (historyCount >= mapPoolSize - 1) return null;
    const actor: VetoActor = historyCount % 2 === 0 ? 'user' : 'cpu';
    return {
      stepIndex: historyCount,
      actor,
      action: 'ban',
      description: actor === 'user' ? 'P1 (Você) bane um mapa' : 'P2 (CPU) bane um mapa'
    };
  }

  // BO3 for 7 maps
  if (historyCount >= 6) return null;
  return BO3_SEVEN_MAP_SEQUENCE[historyCount] || null;
}


/**
 * Determine sides for a given round number
 * Regulation (MR12):
 * - Rounds 1 to 12 (First Half): Team 1 is CT, Team 2 is T
 * - Rounds 13 to 24 (Second Half): Team 1 is T, Team 2 is CT
 * Overtime (6 rounds per OT block):
 * - Each OT block consists of 2 halves of 3 rounds:
 *   - First 3 rounds: Team 1 is CT, Team 2 is T
 *   - Last 3 rounds: Team 1 is T, Team 2 is CT
 */
export function getTeamSides(roundNum: number): {
  phase: 'regulation' | 'overtime';
  overtimeBlock: number;
  t1Side: 'CT' | 'T';
  t2Side: 'CT' | 'T';
} {
  if (roundNum <= 24) {
    const isFirstHalf = roundNum <= 12;
    return {
      phase: 'regulation',
      overtimeBlock: 0,
      t1Side: isFirstHalf ? 'CT' : 'T',
      t2Side: isFirstHalf ? 'T' : 'CT'
    };
  }

  // Overtime
  const otRoundIndex = roundNum - 25; // 0-indexed OT round
  const otBlock = Math.floor(otRoundIndex / 6) + 1; // 1 for OT1, 2 for OT2...
  const roundInBlock = otRoundIndex % 6; // 0, 1, 2 = 1st OT half; 3, 4, 5 = 2nd OT half
  const isFirstOtHalf = roundInBlock < 3;

  return {
    phase: 'overtime',
    overtimeBlock: otBlock,
    t1Side: isFirstOtHalf ? 'CT' : 'T',
    t2Side: isFirstOtHalf ? 'T' : 'CT'
  };
}

/**
 * Pure helper to test and evaluate whether a match is finished under MR12 + continuous OT
 */
export function evaluateMatchStatus(t1Score: number, t2Score: number): {
  isFinished: boolean;
  winner: 1 | 2 | null;
  phase: 'regulation' | 'overtime';
  targetScore: number;
} {
  // Regulation: 12-12 means tie, need OT
  if (t1Score <= 12 && t2Score <= 12) {
    return { isFinished: false, winner: null, phase: 'regulation', targetScore: 13 };
  }

  // Regulation win: first to 13 before opponent gets 12 (or 13-11 max regulation win)
  if (t1Score === 13 && t2Score < 12) {
    return { isFinished: true, winner: 1, phase: 'regulation', targetScore: 13 };
  }
  if (t2Score === 13 && t1Score < 12) {
    return { isFinished: true, winner: 2, phase: 'regulation', targetScore: 13 };
  }

  // If score reached 12-12 or beyond, we are in overtime
  // Target scores: OT1 -> 16, OT2 -> 19, OT3 -> 22, etc.
  // In OT block k (starting at baseline 12 + 3*(k-1)):
  // Winning target is 16 + 3*(k-1)
  // Tie score is 15 + 3*(k-1), which triggers block k+1
  let otBlock = 1;
  while (true) {
    const target = 16 + 3 * (otBlock - 1);
    const tieScore = 15 + 3 * (otBlock - 1); // 15, 18, 21...

    // If both teams have passed the tie score of this block (e.g. both >= 15),
    // they entered the next OT block!
    if (Math.min(t1Score, t2Score) >= tieScore) {
      otBlock++;
      continue;
    }

    // Check if a team has reached the target of this OT block
    if (t1Score >= target && t1Score - t2Score >= 2) {
      return { isFinished: true, winner: 1, phase: 'overtime', targetScore: target };
    }
    if (t2Score >= target && t2Score - t1Score >= 2) {
      return { isFinished: true, winner: 2, phase: 'overtime', targetScore: target };
    }

    // Still in progress in this OT block
    return { isFinished: false, winner: null, phase: 'overtime', targetScore: target };
  }
}

/**
 * Simulate an MR12 competitive map between two teams
 * First to 13 rounds in regulation (12-12 -> continuous 6-round OT blocks, first to 16, 19, 22...)
 */
export function simulateCompetitiveMap(
  mapId: string,
  mapName: string,
  team1: TournamentTeam,
  team2: TournamentTeam,
  seed: number,
  roundWinnerOverrides?: Array<1 | 2> // optional deterministic injection for tests
): MapGameResult {
  const rng = seededRandom(seed);

  // Overall + map proficiency weighting
  const t1Prof = team1.mapProficiencies?.[mapId] ?? 50;
  const t2Prof = team2.mapProficiencies?.[mapId] ?? 50;

  // Rating strength difference
  const ovrDiff = team1.ovr - team2.ovr;
  const profDiff = t1Prof - t2Prof;

  // Base probability of team1 winning a single round
  // 50% + (ovrDiff * 1.5%) + (profDiff * 0.4%)
  let t1RoundProb = 0.50 + (ovrDiff * 0.015) + (profDiff * 0.004);
  t1RoundProb = Math.min(0.78, Math.max(0.22, t1RoundProb));

  let t1Score = 0;
  let t2Score = 0;
  let roundNum = 0;
  const rounds: RoundEvent[] = [];

  const roundHighlights = [
    'Eliminação rápida pelo bomb A',
    'Retake espetacular no 2v3',
    'Clutch 1v2 no defuse',
    'Entrada explosiva pelo meio',
    'Eco round surpreendente',
    'Double kill com Desert Eagle',
    'Abertura de AWP avassaladora',
    'Domínio de mapa perfeito',
    'Varado crucial através da fumaça',
    'Defesa impecável no bomb B'
  ];

  while (true) {
    roundNum++;
    const sideInfo = getTeamSides(roundNum);
    const isPistol = roundNum === 1 || roundNum === 13;

    let t1WinsRound: boolean;
    if (roundWinnerOverrides && roundWinnerOverrides.length >= roundNum) {
      t1WinsRound = roundWinnerOverrides[roundNum - 1] === 1;
    } else {
      t1WinsRound = rng() < t1RoundProb;
    }

    if (t1WinsRound) {
      t1Score++;
    } else {
      t2Score++;
    }

    const highlight = roundHighlights[Math.floor(rng() * roundHighlights.length)];

    const userSide = team1.isUser ? sideInfo.t1Side : sideInfo.t2Side;
    const opponentSide = team1.isUser ? sideInfo.t2Side : sideInfo.t1Side;

    rounds.push({
      roundNumber: roundNum,
      winner: t1WinsRound ? (team1.isUser ? 'user' : 'opponent') : (team2.isUser ? 'user' : 'opponent'),
      userScore: team1.isUser ? t1Score : t2Score,
      opponentScore: team1.isUser ? t2Score : t1Score,
      highlightText: highlight,
      isPistol,
      phase: sideInfo.phase,
      overtimeBlock: sideInfo.overtimeBlock,
      userSide,
      opponentSide
    });

    // Check termination condition immediately after each round
    const status = evaluateMatchStatus(t1Score, t2Score);
    if (status.isFinished) {
      break;
    }

    // Safety cap only to prevent infinite loop in case of bad mocks (100 rounds)
    if (roundNum >= 120) break;
  }

  const userWon = team1.isUser ? (t1Score > t2Score) : (t2Score > t1Score);
  const isOvertime = rounds.some(r => r.phase === 'overtime');
  const maxOtBlock = Math.max(0, ...rounds.map(r => r.overtimeBlock || 0));

  return {
    mapId,
    mapName,
    userScore: team1.isUser ? t1Score : t2Score,
    opponentScore: team1.isUser ? t2Score : t1Score,
    winner: userWon ? 'user' : 'opponent',
    isOvertime,
    overtimeCount: maxOtBlock,
    rounds
  };
}

/**
 * Fully simulate an automated match between two CPU teams
 */
export function simulateCpuVsCpuMatch(
  match: TournamentMatch,
  teams: TournamentTeam[],
  seed: number
): TournamentMatch {
  const team1 = teams.find(t => t.id === match.team1Id)!;
  const team2 = teams.find(t => t.id === match.team2Id)!;

  const rng = seededRandom(seed + match.roundNumber * 101);
  const mapPool = [...TOURNAMENT_MAPS];
  const mapsToPlay: MapMeta[] = [];

  if (match.format === 'BO1') {
    // Pick 1 random map
    mapsToPlay.push(mapPool[Math.floor(rng() * mapPool.length)]);
  } else {
    // BO3: pick up to 3 maps
    mapPool.sort(() => rng() - 0.5);
    mapsToPlay.push(mapPool[0], mapPool[1], mapPool[2]);
  }

  const mapResults: MapGameResult[] = [];
  let t1MapWins = 0;
  let t2MapWins = 0;

  for (let i = 0; i < mapsToPlay.length; i++) {
    const map = mapsToPlay[i];
    const game = simulateCompetitiveMap(map.id, map.name, team1, team2, seed + i * 37);
    mapResults.push(game);

    if (game.winner === (team1.isUser ? 'user' : 'opponent')) {
      t1MapWins++;
    } else {
      t2MapWins++;
    }

    if (match.format === 'BO1' && (t1MapWins === 1 || t2MapWins === 1)) break;
    if (match.format === 'BO3' && (t1MapWins === 2 || t2MapWins === 2)) break;
  }

  const team1Won = t1MapWins > t2MapWins;

  return {
    ...match,
    status: 'completed',
    mapResults,
    winnerId: team1Won ? team1.id : team2.id,
    loserId: team1Won ? team2.id : team1.id
  };
}

/**
 * Apply completed match results to the tournament standings:
 * - Update wins/losses
 * - Check qualification (3 wins) and elimination (3 losses)
 */
export function updateTournamentStandings(
  teams: TournamentTeam[],
  completedMatches: TournamentMatch[]
): TournamentTeam[] {
  // Re-calculate records from completed matches
  const updated = teams.map(t => ({
    ...t,
    wins: 0,
    losses: 0,
    status: 'active' as 'active' | 'qualified' | 'eliminated',
    roundRecords: [{ wins: 0, losses: 0 }]
  }));

  const teamMap = new Map<string, TournamentTeam>();
  updated.forEach(t => teamMap.set(t.id, t));

  completedMatches.forEach(m => {
    if (m.status !== 'completed' || !m.winnerId || !m.loserId) return;
    const winner = teamMap.get(m.winnerId);
    const loser = teamMap.get(m.loserId);
    if (winner) winner.wins++;
    if (loser) loser.losses++;
  });

  updated.forEach(t => {
    if (t.wins >= 3) {
      t.status = 'qualified';
    } else if (t.losses >= 3) {
      t.status = 'eliminated';
    } else {
      t.status = 'active';
    }
  });

  return updated;
}
