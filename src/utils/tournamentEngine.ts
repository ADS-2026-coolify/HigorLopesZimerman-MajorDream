import { Player } from '../types';
import { ACTIVE_MAPS, HISTORICAL_TEAMS } from '../data/csData';
import { calculateFinalProficiency } from './mapProficiency';
import {
  TournamentTeam,
  TournamentMatch,
  SwissTournamentState,
  MatchFormat,
  MapVetoState,
  MapGameResult,
  RoundEvent,
  VetoStep,
  MajorTournamentState,
  MajorMachineState,
  MajorStageId,
  StageEntryPoolsConfig,
  PlayoffBracketState,
  PlayoffBracketMatch,
  PlayoffSeedingStrategy
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

/**
 * Deterministic Fisher-Yates shuffle using provided PRNG
 */
function deterministicShuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
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
 * Derive user team's map proficiency from allocated map points and base proficiency
 * Formula: final proficiency = base proficiency + (allocated points * 5), clamped 0% - 100%
 */
export function getUserMapProficiency(
  mapId: string,
  mapPoints: Record<string, number>,
  baseProficiencies?: Record<string, number>
): number {
  const points = mapPoints[mapId] || 0;
  const base = baseProficiencies?.[mapId] ?? 50;
  return calculateFinalProficiency(base, points);
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
 * Build tournament team pool containing the user team + unique opponents from database
 * Configurable size: default 16 teams (user + 15 opponents), optional 32 teams (user + 31 opponents)
 */
export function initialize16Teams(
  userTeamName: string,
  userLineup: Player[],
  userOvr: number,
  mapPoints: Record<string, number>,
  seed: number = 42,
  baseProficiencies?: Record<string, number>,
  tournamentSize: 16 | 32 = 16
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

  const neededOpponents = tournamentSize - 1;
  const opponents: TournamentTeam[] = [];

  // Deterministic PRNG to select opponents if we have more available than needed
  const rng = seededRandom(seed);
  const eligibleOpponentPool = deterministicShuffle(HISTORICAL_TEAMS, rng);

  eligibleOpponentPool.forEach(ht => {
    if (opponents.length >= neededOpponents) return;
    // Prevent duplicate IDs
    if (opponents.some(o => o.id === ht.id)) return;

    const avgOvr = Math.round(
      ht.roster.reduce((acc, p) => acc + p.ovr, 0) / (ht.roster.length || 1)
    );

    opponents.push({
      id: ht.id,
      name: `${ht.name} '${String(ht.year).slice(-2)}`,
      shortName: ht.shortName || ht.logoText || ht.name.slice(0, 6),
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
    userTeam.mapProficiencies![m.id] = getUserMapProficiency(m.id, mapPoints, baseProficiencies);
  });

  return [userTeam, ...opponents];
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

  let floatingTeams: TournamentTeam[] = [];

  for (let gIdx = 0; gIdx < groupKeys.length; gIdx++) {
    const key = groupKeys[gIdx];
    const isLastGroup = gIdx === groupKeys.length - 1;
    let pool = [
      ...floatingTeams,
      ...deterministicShuffle(groups[key].filter(t => !assigned.has(t.id)), rng)
    ];
    floatingTeams = [];

    // If pool has odd number of teams and not the last group, float the last one to the next group
    if (pool.length % 2 !== 0 && !isLastGroup) {
      floatingTeams.push(pool.pop()!);
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

      // Match format derived from highest-stakes record of the pair
      const formatA = getMatchFormat(teamA.wins, teamA.losses);
      const formatB = getMatchFormat(teamB.wins, teamB.losses);
      const format = formatA === 'BO3' || formatB === 'BO3' ? 'BO3' : 'BO1';

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

    if (pool.length > 0) {
      floatingTeams.push(...pool);
    }
  }

  // Safety fallback: pair any remaining unassigned active teams in pairs
  const unpaired = activeTeams.filter(t => !assigned.has(t.id));
  while (unpaired.length >= 2) {
    const teamA = unpaired.shift()!;
    const teamB = unpaired.shift()!;
    assigned.add(teamA.id);
    assigned.add(teamB.id);
    const formatA = getMatchFormat(teamA.wins, teamA.losses);
    const formatB = getMatchFormat(teamB.wins, teamB.losses);
    const format = formatA === 'BO3' || formatB === 'BO3' ? 'BO3' : 'BO1';
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
 * Exact BO5 Veto Sequence for 7-map pool:
 * Step 1: P1 (User) bans one map
 * Step 2: P2 (CPU) bans one map
 * Step 3: P1 (User) picks Map 1
 * Step 4: P2 (CPU) picks Map 2
 * Step 5: P1 (User) picks Map 3
 * Step 6: P2 (CPU) picks Map 4
 * Step 7: Remaining map automatically assigned as Map 5 (decider)
 */
export const BO5_SEVEN_MAP_SEQUENCE: VetoStepDefinition[] = [
  { stepIndex: 0, actor: 'user', action: 'ban', description: 'P1 (Você) bane um mapa' },
  { stepIndex: 1, actor: 'cpu', action: 'ban', description: 'P2 (CPU) bane um mapa' },
  { stepIndex: 2, actor: 'user', action: 'pick', description: 'P1 (Você) escolhe o Mapa 1' },
  { stepIndex: 3, actor: 'cpu', action: 'pick', description: 'P2 (CPU) escolhe o Mapa 2' },
  { stepIndex: 4, actor: 'user', action: 'pick', description: 'P1 (Você) escolhe o Mapa 3' },
  { stepIndex: 5, actor: 'cpu', action: 'pick', description: 'P2 (CPU) escolhe o Mapa 4' },
];

export function validateBo5VetoPool(mapPoolSize: number = TOURNAMENT_MAPS.length): boolean {
  return mapPoolSize >= 7;
}

/**
 * Pure transition function for BO1, BO3, and BO5 Veto State Machine
 */
export function transitionVetoState(
  currentState: MapVetoState,
  actionMapId: string,
  actionMapName: string,
  mapPool: MapMeta[] = TOURNAMENT_MAPS
): MapVetoState {
  const { format, bannedMaps, pickedMaps, history } = currentState;
  if (format === 'BO5' && !validateBo5VetoPool(mapPool.length)) {
    throw new Error(`Invalid map pool size (${mapPool.length}) for BO5 veto: requires at least 7 maps to produce 5 unique maps.`);
  }
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
  } else if (format === 'BO5') {
    // BO5 (7 maps pool):
    // After 6 steps (2 bans, 4 picks), 1 map remains and becomes Map 5 automatically.
    if (newHistory.length === 6 || remainingMaps.length === 1) {
      const deciderMap = remainingMaps[0];
      finalPickedMaps = [...newPicked, deciderMap.id];
      decider = deciderMap.id;
      nextTurn = 'completed';
    } else {
      const nextStepDef = BO5_SEVEN_MAP_SEQUENCE[newHistory.length];
      if (nextStepDef) {
        if (nextStepDef.action === 'ban') {
          nextTurn = nextStepDef.actor === 'user' ? 'user_ban' : 'cpu_ban';
        } else {
          nextTurn = nextStepDef.actor === 'user' ? 'user_pick' : 'cpu_pick';
        }
      }
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

  if (format === 'BO5') {
    if (mapPoolSize < 7 || historyCount >= 6) return null;
    return BO5_SEVEN_MAP_SEQUENCE[historyCount] || null;
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

  const getFallbackRoster = (team: TournamentTeam) => {
    if (team.roster && team.roster.length > 0) return team.roster.slice(0, 5);
    return [
      { id: 'bot-1', nickname: 'Entry Bot', country: 'SE', role: 'entry' as const, ovr: team.ovr, teamId: team.id, teamName: team.name, era: '2024', tier: 'contender' as const },
      { id: 'bot-2', nickname: 'AWP Bot', country: 'FR', role: 'awp' as const, ovr: team.ovr, teamId: team.id, teamName: team.name, era: '2024', tier: 'contender' as const },
      { id: 'bot-3', nickname: 'IGL Bot', country: 'DK', role: 'igl' as const, ovr: team.ovr, teamId: team.id, teamName: team.name, era: '2024', tier: 'contender' as const },
      { id: 'bot-4', nickname: 'Rifle Bot', country: 'US', role: 'rifler' as const, ovr: team.ovr, teamId: team.id, teamName: team.name, era: '2024', tier: 'contender' as const },
      { id: 'bot-5', nickname: 'Lurk Bot', country: 'UA', role: 'lurker' as const, ovr: team.ovr, teamId: team.id, teamName: team.name, era: '2024', tier: 'contender' as const },
    ];
  };

  const t1Roster = getFallbackRoster(team1);
  const t2Roster = getFallbackRoster(team2);
  const cumulativeRatingSums: Record<string, number> = {};

  const computePlayerRoundRating = (ovr: number, role: string, wonRound: boolean, r1: number, r2: number): number => {
    // Role impact modifiers (star roles have slightly higher rating ceiling, support/IGL slightly more conservative)
    const roleBonus =
      role === 'awp' || role === 'entry' ? 0.04 :
      role === 'rifler' || role === 'lurker' ? 0.02 :
      role === 'igl' ? -0.03 : -0.02;

    // OVR offset centered around 88 (e.g. 96 OVR -> +0.10, 82 OVR -> -0.08)
    const skillOffset = (ovr - 88) * 0.012 + roleBonus;

    // Base round rating centered around HLTV 2.0 reference (1.06 average)
    const base = (wonRound ? 1.26 : 0.82) + skillOffset;

    // Bell-shaped swing using two random samples (-0.75 to +0.75) + rare pop-off round (multi-kill/clutch)
    const bellSwing = ((r1 + r2) / 2 - 0.5) * 1.5;
    const popOff = r1 > 0.90 && wonRound ? (r1 - 0.90) * 4.5 : 0;

    const raw = Math.min(2.65, Math.max(0.20, base + bellSwing + popOff));
    return Math.round(raw * 100) / 100;
  };

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

    const isT1Perspective = team1.isUser || !team2.isUser;
    const userSide = isT1Perspective ? sideInfo.t1Side : sideInfo.t2Side;
    const opponentSide = isT1Perspective ? sideInfo.t2Side : sideInfo.t1Side;

    const playerRoundRatings: Record<string, number> = {};
    const playerAverageRatings: Record<string, number> = {};

    for (const p of t1Roster) {
      const rRating = computePlayerRoundRating(p.ovr, p.role, t1WinsRound, rng(), rng());
      playerRoundRatings[p.id] = rRating;
      cumulativeRatingSums[p.id] = (cumulativeRatingSums[p.id] || 0) + rRating;
      playerAverageRatings[p.id] = Math.round((cumulativeRatingSums[p.id] / roundNum) * 100) / 100;
    }

    for (const p of t2Roster) {
      const rRating = computePlayerRoundRating(p.ovr, p.role, !t1WinsRound, rng(), rng());
      playerRoundRatings[p.id] = rRating;
      cumulativeRatingSums[p.id] = (cumulativeRatingSums[p.id] || 0) + rRating;
      playerAverageRatings[p.id] = Math.round((cumulativeRatingSums[p.id] / roundNum) * 100) / 100;
    }

    rounds.push({
      roundNumber: roundNum,
      winner: t1WinsRound ? (isT1Perspective ? 'user' : 'opponent') : (isT1Perspective ? 'opponent' : 'user'),
      userScore: isT1Perspective ? t1Score : t2Score,
      opponentScore: isT1Perspective ? t2Score : t1Score,
      highlightText: highlight,
      isPistol,
      phase: sideInfo.phase,
      overtimeBlock: sideInfo.overtimeBlock,
      userSide,
      opponentSide,
      playerRoundRatings,
      playerAverageRatings
    });

    // Check termination condition immediately after each round
    const status = evaluateMatchStatus(t1Score, t2Score);
    if (status.isFinished) {
      break;
    }

    // Safety cap only to prevent infinite loop in case of bad mocks (100 rounds)
    if (roundNum >= 120) break;
  }

  const isT1PerspectiveFinal = team1.isUser || !team2.isUser;
  const userWon = isT1PerspectiveFinal ? (t1Score > t2Score) : (t2Score > t1Score);
  const isOvertime = rounds.some(r => r.phase === 'overtime');
  const maxOtBlock = Math.max(0, ...rounds.map(r => r.overtimeBlock || 0));

  return {
    mapId,
    mapName,
    userScore: isT1PerspectiveFinal ? t1Score : t2Score,
    opponentScore: isT1PerspectiveFinal ? t2Score : t1Score,
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
  } else if (match.format === 'BO5') {
    // BO5: pick 5 unique maps
    const shuffled = deterministicShuffle(mapPool, rng);
    mapsToPlay.push(shuffled[0], shuffled[1], shuffled[2], shuffled[3], shuffled[4]);
  } else {
    // BO3: pick up to 3 maps
    const shuffled = deterministicShuffle(mapPool, rng);
    mapsToPlay.push(shuffled[0], shuffled[1], shuffled[2]);
  }

  const mapResults: MapGameResult[] = [];
  let t1MapWins = 0;
  let t2MapWins = 0;
  const targetWins = match.format === 'BO5' ? 3 : match.format === 'BO3' ? 2 : 1;

  for (let i = 0; i < mapsToPlay.length; i++) {
    const map = mapsToPlay[i];
    const game = simulateCompetitiveMap(map.id, map.name, team1, team2, seed + i * 37);
    mapResults.push(game);

    const t1WonMap = team2.isUser ? game.winner === 'opponent' : game.winner === 'user';

    if (t1WonMap) {
      t1MapWins++;
    } else {
      t2MapWins++;
    }

    if (t1MapWins >= targetWins || t2MapWins >= targetWins) break;
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

// ============================================================================
// FULL 4-STAGE MAJOR PROGRESSION ENGINE (Stage 1 -> Stage 2 -> Stage 3 -> Playoffs)
// ============================================================================

/**
 * Build ranked opponent pool from HISTORICAL_TEAMS and partition into:
 * - stage3TeamIds: top 8 highest-ranked teams (seeds 1..8)
 * - stage2TeamIds: next 8 higher-ranked teams (seeds 9..16)
 * - stage1TeamIds: 15 remaining teams (seeds 17..31)
 */
export function buildDefaultEntryPools(
  seed: number = 42,
  customPools?: Partial<StageEntryPoolsConfig>
): {
  pools: StageEntryPoolsConfig;
  templates: Record<string, TournamentTeam>;
} {
  const rng = seededRandom(seed);

  // Convert all historical teams into ranked TournamentTeam templates
  const allOpponents: TournamentTeam[] = HISTORICAL_TEAMS.map(ht => {
    const avgOvr = Math.round(
      ht.roster.reduce((acc, p) => acc + p.ovr, 0) / (ht.roster.length || 1)
    );
    const mapProficiencies: Record<string, number> = {};
    TOURNAMENT_MAPS.forEach(m => {
      mapProficiencies[m.id] = getOpponentMapProficiency(ht.id, m.id, seed);
    });

    return {
      id: ht.id,
      name: `${ht.name} '${String(ht.year).slice(-2)}`,
      shortName: ht.shortName || ht.logoText || ht.name.slice(0, 6),
      year: ht.year,
      logoText: ht.logoText,
      accentColor: ht.accentColor,
      roster: ht.roster,
      ovr: avgOvr,
      isUser: false,
      wins: 0,
      losses: 0,
      status: 'active',
      roundRecords: [{ wins: 0, losses: 0 }],
      mapProficiencies
    };
  });

  // Sort by OVR descending (with deterministic tie-breaker) to assign rankings
  const shuffledOpponents = deterministicShuffle(allOpponents, rng);
  const ranked = [...shuffledOpponents].sort((a, b) => b.ovr - a.ovr);

  ranked.forEach((t, idx) => {
    t.seed = idx + 1;
  });

  const templates: Record<string, TournamentTeam> = {};
  ranked.forEach(t => {
    templates[t.id] = t;
  });

  const stage3TeamIds = customPools?.stage3TeamIds
    ? [...customPools.stage3TeamIds]
    : ranked.slice(0, 8).map(t => t.id);

  const usedInS3 = new Set(stage3TeamIds);
  const remainingForS2 = ranked.filter(t => !usedInS3.has(t.id));

  const stage2TeamIds = customPools?.stage2TeamIds
    ? [...customPools.stage2TeamIds]
    : remainingForS2.slice(0, 8).map(t => t.id);

  const usedInS2S3 = new Set([...stage3TeamIds, ...stage2TeamIds]);
  const remainingForS1 = ranked.filter(t => !usedInS2S3.has(t.id));

  const stage1TeamIds = customPools?.stage1TeamIds
    ? [...customPools.stage1TeamIds]
    : remainingForS1.slice(0, 15).map(t => t.id);

  stage3TeamIds.forEach(id => { if (templates[id]) templates[id].entryStage = 'stage3'; });
  stage2TeamIds.forEach(id => { if (templates[id]) templates[id].entryStage = 'stage2'; });
  stage1TeamIds.forEach(id => { if (templates[id]) templates[id].entryStage = 'stage1'; });

  return {
    pools: {
      stage1TeamIds,
      stage2TeamIds,
      stage3TeamIds
    },
    templates
  };
}

/**
 * Create a fresh copy of a team reset to 0-0 for a new Swiss stage
 */
export function cloneTeamForStage(team: TournamentTeam, stageId: 'stage1' | 'stage2' | 'stage3'): TournamentTeam {
  return {
    ...team,
    wins: 0,
    losses: 0,
    status: 'active',
    roundRecords: [{ wins: 0, losses: 0 }],
    entryStage: team.entryStage || stageId
  };
}

/**
 * Initialize a 16-team Swiss stage state from 16 participating teams
 */
export function createSwissStageState(
  tournamentId: string,
  stageId: 'stage1' | 'stage2' | 'stage3',
  teams: TournamentTeam[],
  seed: number
): SwissTournamentState {
  if (teams.length !== 16) {
    throw new Error(`Swiss ${stageId} requires exactly 16 teams, got ${teams.length}`);
  }
  const uniqueIds = new Set(teams.map(t => t.id));
  if (uniqueIds.size !== 16) {
    throw new Error(`Duplicate team IDs detected in ${stageId}`);
  }

  const resetTeams = teams.map(t => cloneTeamForStage(t, stageId));
  const round1Pairings = generateSwissPairings(resetTeams, [], 1, seed);
  const userInStage = resetTeams.find(t => t.id === 'user-team');

  return {
    tournamentId,
    stageId,
    seed,
    currentRound: 1,
    teams: resetTeams,
    matchesByRound: { 1: round1Pairings },
    completedMatches: [],
    isCompleted: false,
    userStatus: userInStage ? 'active' : 'eliminated'
  };
}

/**
 * Initialize the full Major Tournament starting at Stage 1
 */
export function initializeMajorTournament(
  tournamentId: string,
  userTeamName: string,
  userLineup: Player[],
  userOvr: number,
  mapPoints: Record<string, number>,
  seed: number = 42,
  baseProficiencies?: Record<string, number>,
  customPools?: Partial<StageEntryPoolsConfig>
): MajorTournamentState {
  const { pools, templates } = buildDefaultEntryPools(seed, customPools);

  const userMapProficiencies: Record<string, number> = {};
  TOURNAMENT_MAPS.forEach(m => {
    userMapProficiencies[m.id] = getUserMapProficiency(m.id, mapPoints, baseProficiencies);
  });

  const userTeamBase: TournamentTeam = {
    id: 'user-team',
    name: userTeamName || 'Meu Time',
    shortName: (userTeamName || 'USER').slice(0, 8),
    logoText: (userTeamName || 'CS').slice(0, 2).toUpperCase(),
    accentColor: '#10B981',
    roster: userLineup,
    ovr: userOvr,
    seed: 16,
    entryStage: 'stage1',
    isUser: true,
    wins: 0,
    losses: 0,
    status: 'active',
    roundRecords: [{ wins: 0, losses: 0 }],
    mapProficiencies: userMapProficiencies
  };

  templates[userTeamBase.id] = userTeamBase;

  const stage1Teams: TournamentTeam[] = [
    userTeamBase,
    ...pools.stage1TeamIds.map(id => templates[id]).filter(Boolean)
  ];

  const stage1 = createSwissStageState(tournamentId, 'stage1', stage1Teams, seed + 101);

  return {
    tournamentId,
    seed,
    machineState: 'stage1_active',
    activeStageId: 'stage1',
    userTeamBase,
    entryPools: pools,
    allTeamTemplates: templates,
    eliminatedTeamIds: [],
    stages: {
      stage1
    }
  };
}

/**
 * Advance a single Swiss stage by applying completed round matches (or simulating all matches if auto)
 */
export function advanceSwissStageRound(
  stageState: SwissTournamentState,
  completedRoundMatches: TournamentMatch[]
): SwissTournamentState {
  const newCompletedMatches = [...stageState.completedMatches, ...completedRoundMatches];
  const updatedTeams = updateTournamentStandings(stageState.teams, newCompletedMatches);
  const updatedUser = updatedTeams.find(t => t.id === 'user-team');

  const remainingActiveTeams = updatedTeams.filter(t => t.status === 'active');
  const isStageOver = remainingActiveTeams.length === 0 || stageState.currentRound >= 5;

  let nextRound = stageState.currentRound;
  const newMatchesByRound: Record<number, TournamentMatch[]> = {
    ...stageState.matchesByRound,
    [stageState.currentRound]: completedRoundMatches
  };

  if (!isStageOver) {
    nextRound = stageState.currentRound + 1;
    const nextPairings = generateSwissPairings(
      updatedTeams,
      newCompletedMatches,
      nextRound,
      stageState.seed + nextRound * 997
    );
    newMatchesByRound[nextRound] = nextPairings;
  }

  return {
    ...stageState,
    currentRound: nextRound,
    teams: updatedTeams,
    matchesByRound: newMatchesByRound,
    completedMatches: newCompletedMatches,
    isCompleted: isStageOver,
    userStatus: updatedUser ? updatedUser.status : stageState.userStatus
  };
}

/**
 * Helper to auto-simulate an entire Swiss stage to completion (for CPU-only rounds or testing)
 */
export function simulateSwissStageToCompletion(stageState: SwissTournamentState): SwissTournamentState {
  let current = { ...stageState };
  let safety = 0;
  while (!current.isCompleted && safety < 10) {
    safety++;
    const roundMatches = current.matchesByRound[current.currentRound] || [];
    const simulated = roundMatches.map((m, idx) =>
      m.status === 'completed'
        ? m
        : simulateCpuVsCpuMatch(m, current.teams, current.seed + current.currentRound * 131 + idx * 79)
    );
    current = advanceSwissStageRound(current, simulated);
  }
  return current;
}

/**
 * Sort qualified teams by Swiss performance to assign seeds 1..8:
 * Primary: fewer losses (3-0 > 3-1 > 3-2)
 * Secondary: higher OVR
 * Tertiary: lower initial seed
 */
export function rankSwissQualifiers(teams: TournamentTeam[]): TournamentTeam[] {
  const qualified = teams.filter(t => t.status === 'qualified');
  return [...qualified].sort((a, b) => {
    if (a.losses !== b.losses) return a.losses - b.losses; // 3-0 (0) before 3-1 (1) before 3-2 (2)
    if (b.ovr !== a.ovr) return b.ovr - a.ovr;
    return (a.seed ?? 99) - (b.seed ?? 99);
  });
}

/**
 * Finalize a completed Swiss stage and transition machine state to `stageX_complete`
 * Verifies all matches are complete and exactly 8 teams qualified & 8 eliminated.
 */
export function completeCurrentSwissStage(major: MajorTournamentState): MajorTournamentState {
  const stageKey = major.activeStageId;
  if (stageKey !== 'stage1' && stageKey !== 'stage2' && stageKey !== 'stage3') {
    return major;
  }

  const stage = major.stages[stageKey];
  if (!stage || !stage.isCompleted) {
    throw new Error(`Stage ${stageKey} is not yet completed`);
  }

  const qualifiers = stage.teams.filter(t => t.status === 'qualified');
  const eliminated = stage.teams.filter(t => t.status === 'eliminated');

  if (qualifiers.length !== 8 || eliminated.length !== 8) {
    throw new Error(`Stage ${stageKey} must finish with 8 qualified and 8 eliminated teams (got ${qualifiers.length} / ${eliminated.length})`);
  }

  const newEliminatedIds = Array.from(new Set([
    ...major.eliminatedTeamIds,
    ...eliminated.map(t => t.id)
  ]));

  const nextMachineState: MajorMachineState =
    stageKey === 'stage1' ? 'stage1_complete' :
    stageKey === 'stage2' ? 'stage2_complete' :
    'stage3_complete';

  return {
    ...major,
    machineState: nextMachineState,
    eliminatedTeamIds: newEliminatedIds
  };
}

/**
 * Generate Quarterfinal bracket from 8 Stage 3 qualifiers using configurable seeding strategy
 * Default 'high_vs_low' pairs:
 * - QF1: Seed 1 vs Seed 8 (feeds SF1)
 * - QF2: Seed 4 vs Seed 5 (feeds SF1)
 * - QF3: Seed 2 vs Seed 7 (feeds SF2)
 * - QF4: Seed 3 vs Seed 6 (feeds SF2)
 * If 'avoid_rematch' is used, swaps opponent seeds (e.g. 7/8 or 5/6) if a Stage 3 rematch occurs.
 */
export function createPlayoffBracket(
  stage3State: SwissTournamentState,
  seedingStrategy: PlayoffSeedingStrategy = 'high_vs_low'
): PlayoffBracketState {
  const orderedQualifiers = rankSwissQualifiers(stage3State.teams);
  if (orderedQualifiers.length !== 8) {
    throw new Error(`Playoffs require exactly 8 qualified teams from Stage 3, got ${orderedQualifiers.length}`);
  }

  const seededTeams = orderedQualifiers.map((t, idx) => ({
    ...t,
    seed: idx + 1
  }));

  const pastPairs = new Set<string>();
  stage3State.completedMatches.forEach(m => {
    pastPairs.add(`${m.team1Id}_${m.team2Id}`);
    pastPairs.add(`${m.team2Id}_${m.team1Id}`);
  });

  // Standard bracket seed pairings: [ (1,8), (4,5), (2,7), (3,6) ]
  let pairs: Array<[number, number]> = [
    [0, 7], // QF1: #1 vs #8
    [3, 4], // QF2: #4 vs #5
    [1, 6], // QF3: #2 vs #7
    [2, 5]  // QF4: #3 vs #6
  ];

  if (seedingStrategy === 'avoid_rematch') {
    // Check if #1 played #8; if so and swapping #8 with #7 avoids rematches, swap
    const s1 = seededTeams[0];
    const s8 = seededTeams[7];
    const s2 = seededTeams[1];
    const s7 = seededTeams[6];
    if (pastPairs.has(`${s1.id}_${s8.id}`) && !pastPairs.has(`${s1.id}_${s7.id}`) && !pastPairs.has(`${s2.id}_${s8.id}`)) {
      pairs[0] = [0, 6];
      pairs[2] = [1, 7];
    }
  }

  const qfSlots: Array<{ slot: 'QF1' | 'QF2' | 'QF3' | 'QF4'; nextSlot: 'SF1' | 'SF2'; pair: [number, number] }> = [
    { slot: 'QF1', nextSlot: 'SF1', pair: pairs[0] },
    { slot: 'QF2', nextSlot: 'SF1', pair: pairs[1] },
    { slot: 'QF3', nextSlot: 'SF2', pair: pairs[2] },
    { slot: 'QF4', nextSlot: 'SF2', pair: pairs[3] }
  ];

  const quarterfinals: PlayoffBracketMatch[] = qfSlots.map((q, idx) => {
    const tA = seededTeams[q.pair[0]];
    const tB = seededTeams[q.pair[1]];
    // Put user team as team1 if present for consistent UI
    const [t1, t2] = tB.isUser ? [tB, tA] : [tA, tB];

    const match: TournamentMatch = {
      id: `playoff_${q.slot}_${t1.id}_vs_${t2.id}`,
      roundNumber: 1,
      team1Id: t1.id,
      team2Id: t2.id,
      format: 'BO3',
      status: 'pending_veto',
      mapResults: [],
      stage: 'playoffs',
      bracketSlot: q.slot
    };

    return {
      slot: q.slot,
      round: 'quarterfinals',
      format: 'BO3',
      seed1: tA.seed,
      seed2: tB.seed,
      team1: t1,
      team2: t2,
      match,
      nextSlot: q.nextSlot
    };
  });

  const semifinals: PlayoffBracketMatch[] = [
    {
      slot: 'SF1',
      round: 'semifinals',
      format: 'BO3',
      nextSlot: 'GF'
    },
    {
      slot: 'SF2',
      round: 'semifinals',
      format: 'BO3',
      nextSlot: 'GF'
    }
  ];

  const grandFinal: PlayoffBracketMatch = {
    slot: 'GF',
    round: 'grand_final',
    format: 'BO5'
  };

  return {
    seedingStrategy,
    seededTeams,
    currentRound: 'quarterfinals',
    quarterfinals,
    semifinals,
    grandFinal
  };
}

/**
 * Confirm continuation from a completed stage (`stage1_complete`, `stage2_complete`, `stage3_complete`)
 * to the next stage (`stage2_active`, `stage3_active`, `playoffs_active`).
 */
export function advanceToNextMajorStage(
  major: MajorTournamentState,
  playoffSeedingStrategy: PlayoffSeedingStrategy = 'high_vs_low'
): MajorTournamentState {
  if (major.machineState === 'stage1_complete') {
    const s1 = major.stages.stage1;
    const s1Qualifiers = rankSwissQualifiers(s1.teams);
    if (s1Qualifiers.length !== 8) {
      throw new Error(`Cannot start Stage 2: expected 8 qualifiers from Stage 1, got ${s1Qualifiers.length}`);
    }

    const eliminatedSet = new Set(major.eliminatedTeamIds);
    const s2Entrants = major.entryPools.stage2TeamIds.map(id => {
      if (eliminatedSet.has(id)) {
        throw new Error(`Eliminated team ${id} cannot re-enter Stage 2`);
      }
      const tmpl = major.allTeamTemplates[id];
      if (!tmpl) throw new Error(`Missing team template for Stage 2 entrant ${id}`);
      return tmpl;
    });

    const stage2Teams = [...s1Qualifiers, ...s2Entrants];
    const stage2 = createSwissStageState(major.tournamentId, 'stage2', stage2Teams, major.seed + 202);

    return {
      ...major,
      machineState: 'stage2_active',
      activeStageId: 'stage2',
      stages: {
        ...major.stages,
        stage2
      }
    };
  }

  if (major.machineState === 'stage2_complete') {
    const s2 = major.stages.stage2;
    if (!s2) throw new Error('Stage 2 state missing');
    const s2Qualifiers = rankSwissQualifiers(s2.teams);
    if (s2Qualifiers.length !== 8) {
      throw new Error(`Cannot start Stage 3: expected 8 qualifiers from Stage 2, got ${s2Qualifiers.length}`);
    }

    const eliminatedSet = new Set(major.eliminatedTeamIds);
    const s3Entrants = major.entryPools.stage3TeamIds.map(id => {
      if (eliminatedSet.has(id)) {
        throw new Error(`Eliminated team ${id} cannot re-enter Stage 3`);
      }
      const tmpl = major.allTeamTemplates[id];
      if (!tmpl) throw new Error(`Missing team template for Stage 3 entrant ${id}`);
      return tmpl;
    });

    const stage3Teams = [...s2Qualifiers, ...s3Entrants];
    const stage3 = createSwissStageState(major.tournamentId, 'stage3', stage3Teams, major.seed + 303);

    return {
      ...major,
      machineState: 'stage3_active',
      activeStageId: 'stage3',
      stages: {
        ...major.stages,
        stage3
      }
    };
  }

  if (major.machineState === 'stage3_complete') {
    const s3 = major.stages.stage3;
    if (!s3) throw new Error('Stage 3 state missing');
    const playoffs = createPlayoffBracket(s3, playoffSeedingStrategy);

    return {
      ...major,
      machineState: 'playoffs_active',
      activeStageId: 'playoffs',
      playoffs
    };
  }

  return major;
}

/**
 * Record a completed Playoff match (or simulate remaining CPU matches in the current playoff round)
 * and advance winners along the bracket path:
 * - QF1 winner vs QF2 winner -> SF1
 * - QF3 winner vs QF4 winner -> SF2
 * - SF1 winner vs SF2 winner -> GF (BO5)
 * - GF winner -> Major Champion!
 */
export function recordPlayoffMatchResult(
  major: MajorTournamentState,
  completedMatch: TournamentMatch
): MajorTournamentState {
  if (!major.playoffs) throw new Error('Playoffs not initialized');
  const bracket = major.playoffs;

  const findTeam = (id?: string): TournamentTeam | undefined => {
    if (!id) return undefined;
    return bracket.seededTeams.find(t => t.id === id) || major.allTeamTemplates[id];
  };

  let updatedQFs = [...bracket.quarterfinals];
  let updatedSFs = [...bracket.semifinals];
  let updatedGF = { ...bracket.grandFinal };
  let currentRound = bracket.currentRound;
  let champion = bracket.champion;
  let runnerUp = bracket.runnerUp;
  let machineState = major.machineState;
  const newEliminatedIds = new Set(major.eliminatedTeamIds);

  if (completedMatch.loserId) {
    newEliminatedIds.add(completedMatch.loserId);
  }

  if (bracket.currentRound === 'quarterfinals') {
    updatedQFs = updatedQFs.map(qf =>
      qf.slot === completedMatch.bracketSlot || qf.match?.id === completedMatch.id
        ? { ...qf, match: completedMatch }
        : qf
    );

    // Only build semifinals once ALL 4 quarterfinals are completed
    if (updatedQFs.every(qf => qf.match?.status === 'completed' && qf.match.winnerId)) {
      const qf1Winner = findTeam(updatedQFs[0].match!.winnerId)!;
      const qf2Winner = findTeam(updatedQFs[1].match!.winnerId)!;
      const qf3Winner = findTeam(updatedQFs[2].match!.winnerId)!;
      const qf4Winner = findTeam(updatedQFs[3].match!.winnerId)!;

      const [sf1T1, sf1T2] = qf2Winner.isUser ? [qf2Winner, qf1Winner] : [qf1Winner, qf2Winner];
      const [sf2T1, sf2T2] = qf4Winner.isUser ? [qf4Winner, qf3Winner] : [qf3Winner, qf4Winner];

      updatedSFs = [
        {
          slot: 'SF1',
          round: 'semifinals',
          format: 'BO3',
          seed1: sf1T1.seed,
          seed2: sf1T2.seed,
          team1: sf1T1,
          team2: sf1T2,
          nextSlot: 'GF',
          match: {
            id: `playoff_SF1_${sf1T1.id}_vs_${sf1T2.id}`,
            roundNumber: 2,
            team1Id: sf1T1.id,
            team2Id: sf1T2.id,
            format: 'BO3',
            status: 'pending_veto',
            mapResults: [],
            stage: 'playoffs',
            bracketSlot: 'SF1'
          }
        },
        {
          slot: 'SF2',
          round: 'semifinals',
          format: 'BO3',
          seed1: sf2T1.seed,
          seed2: sf2T2.seed,
          team1: sf2T1,
          team2: sf2T2,
          nextSlot: 'GF',
          match: {
            id: `playoff_SF2_${sf2T1.id}_vs_${sf2T2.id}`,
            roundNumber: 2,
            team1Id: sf2T1.id,
            team2Id: sf2T2.id,
            format: 'BO3',
            status: 'pending_veto',
            mapResults: [],
            stage: 'playoffs',
            bracketSlot: 'SF2'
          }
        }
      ];
      currentRound = 'semifinals';
    }
  } else if (bracket.currentRound === 'semifinals') {
    updatedSFs = updatedSFs.map(sf =>
      sf.slot === completedMatch.bracketSlot || sf.match?.id === completedMatch.id
        ? { ...sf, match: completedMatch }
        : sf
    );

    // Only build Grand Final once BOTH semifinals are completed
    if (updatedSFs.every(sf => sf.match?.status === 'completed' && sf.match.winnerId)) {
      const sf1Winner = findTeam(updatedSFs[0].match!.winnerId)!;
      const sf2Winner = findTeam(updatedSFs[1].match!.winnerId)!;
      const [gfT1, gfT2] = sf2Winner.isUser ? [sf2Winner, sf1Winner] : [sf1Winner, sf2Winner];

      updatedGF = {
        slot: 'GF',
        round: 'grand_final',
        format: 'BO5',
        seed1: gfT1.seed,
        seed2: gfT2.seed,
        team1: gfT1,
        team2: gfT2,
        match: {
          id: `playoff_GF_${gfT1.id}_vs_${gfT2.id}`,
          roundNumber: 3,
          team1Id: gfT1.id,
          team2Id: gfT2.id,
          format: 'BO5',
          status: 'pending_veto',
          mapResults: [],
          stage: 'playoffs',
          bracketSlot: 'GF'
        }
      };
      currentRound = 'grand_final';
    }
  } else if (bracket.currentRound === 'grand_final') {
    // Validate BO5 completion: winner must have won 3 maps
    const t1Wins = completedMatch.mapResults.filter(m =>
      updatedGF.team2?.isUser ? m.winner === 'opponent' : m.winner === 'user'
    ).length;
    const t2Wins = completedMatch.mapResults.length - t1Wins;
    if (Math.max(t1Wins, t2Wins) < 3) {
      throw new Error(`Grand final BO5 cannot complete before a team wins 3 maps (score ${t1Wins}-${t2Wins})`);
    }

    updatedGF = {
      ...updatedGF,
      match: completedMatch
    };
    champion = findTeam(completedMatch.winnerId);
    runnerUp = findTeam(completedMatch.loserId);
    currentRound = 'completed';
    machineState = 'tournament_complete';
  }

  return {
    ...major,
    machineState,
    eliminatedTeamIds: Array.from(newEliminatedIds),
    champion,
    runnerUp,
    playoffs: {
      ...bracket,
      currentRound,
      quarterfinals: updatedQFs,
      semifinals: updatedSFs,
      grandFinal: updatedGF,
      champion,
      runnerUp
    }
  };
}

