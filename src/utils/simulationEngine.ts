import { Player, SynergyResult, SimulationRoundResult, SimulatedMatchResult } from '../types';
import { ACTIVE_MAPS, HISTORICAL_TEAMS } from '../data/csData';

// Calculate team synergy based on roles
export function calculateSynergy(lineup: Player[]): SynergyResult {
  if (lineup.length < 5) {
    return {
      type: 'neutral',
      scoreBonus: 0,
      labelKey: 'draft.synergy',
      descriptionKey: 'draft.emptySlot'
    };
  }

  const roleCounts: Record<string, number> = {};
  lineup.forEach(p => {
    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
  });

  const hasIgl = (roleCounts['igl'] || 0) >= 1;
  const hasAwp = (roleCounts['awp'] || 0) >= 1;
  const hasEntry = (roleCounts['entry'] || 0) >= 1;
  const hasLurker = (roleCounts['lurker'] || 0) >= 1;

  // Broken Core: no IGL AND duplicate AWPs or severe duplicate
  if (!hasIgl && (roleCounts['awp'] || 0) > 2) {
    return {
      type: 'broken',
      scoreBonus: -5,
      labelKey: 'draft.synergyBroken',
      descriptionKey: 'draft.synergyBrokenDesc'
    };
  }

  // No IGL
  if (!hasIgl) {
    return {
      type: 'no_igl',
      scoreBonus: -3,
      labelKey: 'draft.synergyNoIgl',
      descriptionKey: 'draft.synergyNoIglDesc'
    };
  }

  // Full Comp: has IGL, AWP, Entry, and either Lurker or balanced roles (+2 OVR bonus)
  if (hasIgl && hasAwp && hasEntry && hasLurker) {
    return {
      type: 'full',
      scoreBonus: 2,
      labelKey: 'draft.synergyFull',
      descriptionKey: 'draft.synergyFullDesc'
    };
  }

  // No Lurker
  if (hasIgl && hasAwp && hasEntry && !hasLurker) {
    return {
      type: 'no_lurker',
      scoreBonus: 0,
      labelKey: 'draft.synergyNoLurker',
      descriptionKey: 'draft.synergyNoLurkerDesc'
    };
  }

  // Broken fallback
  return {
    type: 'broken',
    scoreBonus: -2,
    labelKey: 'draft.synergyBroken',
    descriptionKey: 'draft.synergyBrokenDesc'
  };
}

// Calculate team average OVR including synergy bonus
export function calculateTeamOvr(lineup: Player[]): number {
  if (lineup.length === 0) return 0;
  const sum = lineup.reduce((acc, p) => acc + p.ovr, 0);
  const baseAvg = Math.round(sum / lineup.length);
  if (lineup.length === 5) {
    const synergy = calculateSynergy(lineup);
    return Math.max(60, Math.min(99, baseAvg + synergy.scoreBonus));
  }
  return baseAvg;
}

// Simulate a single MR12 match (first to 13 rounds, overtime 16)
export function simulateMatch(
  stage: 'swiss' | 'playoff',
  roundName: string,
  userLineup: Player[],
  mapPoints: Record<string, number>,
  usedOpponentIds: string[] = []
): SimulatedMatchResult {
  // Pick an opponent team not already played if possible
  const availableOpponents = HISTORICAL_TEAMS.filter(t => !usedOpponentIds.includes(t.id));
  const opponentTemplate = availableOpponents.length > 0 
    ? availableOpponents[Math.floor(Math.random() * availableOpponents.length)]
    : HISTORICAL_TEAMS[Math.floor(Math.random() * HISTORICAL_TEAMS.length)];

  const opponentRoster = opponentTemplate.roster;
  const opponentBaseOvr = Math.round(opponentRoster.reduce((acc, p) => acc + p.ovr, 0) / opponentRoster.length);

  // Pick random map
  const mapObj = ACTIVE_MAPS[Math.floor(Math.random() * ACTIVE_MAPS.length)];
  const mapAdvantage = (mapPoints[mapObj.id] || 0) * 1.5; // each point gives +1.5 OVR advantage on that map

  const userOvr = calculateTeamOvr(userLineup) + mapAdvantage;
  const opponentOvr = opponentBaseOvr;

  // Round simulation
  const roundsHistory: SimulationRoundResult[] = [];
  let userScore = 0;
  let opponentScore = 0;
  let currentRound = 1;

  // Probability weight
  const userProb = Math.max(0.25, Math.min(0.75, 0.5 + (userOvr - opponentOvr) * 0.025));

  let isOvertime = false;

  while (true) {
    const isPistol = currentRound === 1 || currentRound === 13;
    const winRoll = Math.random();
    const userWonRound = winRoll < userProb;

    if (userWonRound) {
      userScore++;
    } else {
      opponentScore++;
    }

    // Dynamic highlight narrative
    const actor = userWonRound 
      ? userLineup[Math.floor(Math.random() * userLineup.length)].nickname
      : opponentRoster[Math.floor(Math.random() * opponentRoster.length)].nickname;
    
    let highlight = '';
    if (isPistol) {
      highlight = `${actor} fecha o round de pistol com mira afiada!`;
    } else if (currentRound === 12 || currentRound === 24) {
      highlight = `${actor} garante round crucial na troca de lados!`;
    } else if (userScore >= 12 || opponentScore >= 12) {
      highlight = `Match point! ${actor} converte clutch decisivo!`;
    } else {
      const actions = [
        `${actor} garante 2 abates na entrada do bombsite.`,
        `Retake espetacular liderado por ${actor}.`,
        `${actor} encontra uma eliminação crucial de AWP.`,
        `Defuse na fumaça após jogada tática de ${actor}.`,
        `${actor} limpa o clutch 1v2 no detalhe.`
      ];
      highlight = actions[Math.floor(Math.random() * actions.length)];
    }

    roundsHistory.push({
      roundNumber: currentRound,
      winner: userWonRound ? 'user' : 'opponent',
      userRoundScore: userScore,
      opponentRoundScore: opponentScore,
      highlightText: highlight,
      isPistol
    });

    // Check regulation win (13 rounds, 2 round lead)
    if (!isOvertime) {
      if (userScore === 13 && opponentScore <= 11) break;
      if (opponentScore === 13 && userScore <= 11) break;
      if (userScore === 12 && opponentScore === 12) {
        isOvertime = true;
      }
    } else {
      // Overtime (first to reach +4 or 2 lead above 15)
      if (userScore >= 16 && userScore - opponentScore >= 2) break;
      if (opponentScore >= 16 && opponentScore - userScore >= 2) break;
      if (currentRound > 36) break; // Hard cap
    }

    currentRound++;
  }

  const userWon = userScore > opponentScore;

  // Generate Player Stats
  const totalRounds = userScore + opponentScore;
  const playerPerformances = userLineup.map(p => {
    // Generate realistic stats centered on their rating and OVR
    const ratingMultiplier = (p.stats.rating / 1.15) * (userWon ? 1.08 : 0.92);
    const expectedKills = Math.max(5, Math.round((totalRounds * 0.72) * (p.ovr / 90) * ratingMultiplier * (0.85 + Math.random() * 0.3)));
    const deaths = Math.max(6, Math.round((totalRounds * 0.68) * (1.1 - (p.ovr / 200)) * (0.85 + Math.random() * 0.3)));
    const assists = Math.floor(Math.random() * 8) + 2;
    const matchRating = Number(((expectedKills / Math.max(1, deaths)) * 0.65 + (p.stats.rating * 0.4)).toFixed(2));

    return {
      playerId: p.id,
      nickname: p.nickname,
      kills: expectedKills,
      deaths,
      assists,
      rating: matchRating,
      isMvp: false
    };
  });

  // Pick match MVP
  const sortedPerformers = [...playerPerformances].sort((a, b) => b.rating - a.rating);
  sortedPerformers[0].isMvp = true;
  const bestUserPerformer = sortedPerformers[0];

  const mvp = {
    nickname: bestUserPerformer.nickname,
    team: 'user' as const,
    kd: `${bestUserPerformer.kills}-${bestUserPerformer.deaths}`,
    rating: bestUserPerformer.rating
  };

  return {
    id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stage,
    roundName,
    mapName: mapObj.name,
    opponentTeam: {
      name: opponentTemplate.name,
      ovr: opponentBaseOvr,
      logoText: opponentTemplate.logoText,
      roster: opponentTemplate.roster
    },
    userScore,
    opponentScore,
    isOvertime,
    won: userWon,
    mvp,
    playerPerformances,
    roundsHistory
  };
}
