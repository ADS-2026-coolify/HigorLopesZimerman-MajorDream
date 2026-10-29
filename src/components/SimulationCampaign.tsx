/* Hallmark · redesign: full · keep 4-stage Major progression, stage transitions, BO3/BO5 playoffs, champion screen · semantic tokens */
import React, { useState, useEffect } from 'react';
import { CampaignState } from '../types';
import {
  MajorTournamentState,
  MajorStageId,
  TournamentTeam,
  TournamentMatch,
  PlayoffBracketMatch
} from '../types/tournament';
import {
  initializeMajorTournament,
  simulateCpuVsCpuMatch,
  advanceSwissStageRound,
  completeCurrentSwissStage,
  advanceToNextMajorStage,
  recordPlayoffMatchResult,
  rankSwissQualifiers
} from '../utils/tournamentEngine';
import { SwissStandings } from './SwissStandings';
import { MapVetoView } from './MapVetoView';
import { MatchSimulationView } from './MatchSimulationView';
import { TeamLogo } from './TeamLogo';
import { CountryFlag } from './CountryFlag';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { Trophy, Swords, RotateCcw, ArrowRight, CheckCircle2, XCircle, Shield } from 'lucide-react';

const roleBadgeConfig: Record<string, { label: string; bg: string; text: string }> = {
  igl: { label: 'IGL', bg: 'bg-blue-700', text: 'text-white' },
  awp: { label: 'AWP', bg: 'bg-violet-700', text: 'text-white' },
  entry: { label: 'ENT', bg: 'bg-red-700', text: 'text-white' },
  rifler: { label: 'RIF', bg: 'bg-amber-700', text: 'text-white' },
  lurker: { label: 'LURK', bg: 'bg-teal-700', text: 'text-white' },
  support: { label: 'SUP', bg: 'bg-indigo-700', text: 'text-white' },
};

function getHltvRatingMeta(rating?: number): { color: string; label: string } {
  if (rating === undefined) return { color: 'text-cs-muted', label: 'Sem dados' };
  if (rating >= 2.00) return { color: 'text-cs-accent', label: 'Extraordinário (2.00+)' };
  if (rating >= 1.60) return { color: 'text-cs-accent', label: 'Excepcional (1.60–1.99)' };
  if (rating >= 1.40) return { color: 'text-cs-accent', label: 'Excelente (1.40–1.59)' };
  if (rating >= 1.20) return { color: 'text-cs-green', label: 'Muito bom (1.20–1.39)' };
  if (rating >= 1.10) return { color: 'text-cs-green', label: 'Bom (1.10–1.19)' };
  if (rating >= 1.00) return { color: 'text-white', label: 'Na média (1.00–1.09)' };
  if (rating >= 0.90) return { color: 'text-cs-muted', label: 'Abaixo da média (0.90–0.99)' };
  if (rating >= 0.70) return { color: 'text-cs-red', label: 'Ruim (0.70–0.89)' };
  return { color: 'text-cs-red', label: 'Muito abaixo (<0.70)' };
}

interface SimulationCampaignProps {
  campaign: CampaignState;
  onUpdateCampaign: (updated: CampaignState) => void;
  onRestart: () => void;
}

const STAGE_LABELS: Record<MajorStageId, string> = {
  stage1: 'Stage 1',
  stage2: 'Stage 2',
  stage3: 'Stage 3',
  playoffs: 'Playoffs'
};

export const SimulationCampaign: React.FC<SimulationCampaignProps> = ({
  campaign,
  onUpdateCampaign,
  onRestart
}) => {
  // Initialize full 4-stage Major tournament state in memory (fresh on page reload)
  const [major, setMajor] = useState<MajorTournamentState>(() => {
    const initialSeed = Date.now();
    return initializeMajorTournament(
      campaign.campaignId,
      campaign.teamName,
      campaign.lineup,
      campaign.overallOvr,
      campaign.mapPoints,
      initialSeed,
      campaign.baseProficiencies
    );
  });

  // Navigation tab for inspecting stages ('stage1' | 'stage2' | 'stage3' | 'playoffs')
  const [selectedNavStage, setSelectedNavStage] = useState<MajorStageId>(() => major.activeStageId);

  // Sub-view inside the active stage: 'standings' | 'veto' | 'match'
  const [activeView, setActiveView] = useState<'standings' | 'veto' | 'match'>('veto');

  const [activeMapsForMatch, setActiveMapsForMatch] = useState<string[]>([]);

  // Keep selectedNavStage synced when activeStageId advances
  useEffect(() => {
    setSelectedNavStage(major.activeStageId);
  }, [major.activeStageId]);

  // Helper to get active Swiss stage if in stage1/2/3
  const currentSwissStage =
    major.activeStageId !== 'playoffs' ? major.stages[major.activeStageId] : undefined;

  // Find user's current match (either in active Swiss round or active Playoff round)
  const getUserActiveMatchInfo = (): {
    match?: TournamentMatch;
    userTeam?: TournamentTeam;
    opponentTeam?: TournamentTeam;
  } => {
    if (major.activeStageId !== 'playoffs' && currentSwissStage && !currentSwissStage.isCompleted) {
      const roundMatches = currentSwissStage.matchesByRound[currentSwissStage.currentRound] || [];
      const userMatch = roundMatches.find(
        m => (m.team1Id === 'user-team' || m.team2Id === 'user-team') && m.status !== 'completed'
      );
      const uTeam = currentSwissStage.teams.find(t => t.id === 'user-team');
      if (userMatch && uTeam && uTeam.status === 'active') {
        const oppId = userMatch.team1Id === 'user-team' ? userMatch.team2Id : userMatch.team1Id;
        const oppTeam = currentSwissStage.teams.find(t => t.id === oppId);
        return { match: userMatch, userTeam: uTeam, opponentTeam: oppTeam };
      }
      return { userTeam: uTeam };
    }

    if (major.activeStageId === 'playoffs' && major.playoffs && major.machineState === 'playoffs_active') {
      const pb = major.playoffs;
      const activeSlots: PlayoffBracketMatch[] =
        pb.currentRound === 'quarterfinals'
          ? pb.quarterfinals
          : pb.currentRound === 'semifinals'
          ? pb.semifinals
          : pb.currentRound === 'grand_final'
          ? [pb.grandFinal]
          : [];

      const userBracketSlot = activeSlots.find(
        s =>
          s.match &&
          s.match.status !== 'completed' &&
          (s.match.team1Id === 'user-team' || s.match.team2Id === 'user-team')
      );

      if (userBracketSlot && userBracketSlot.match && userBracketSlot.team1 && userBracketSlot.team2) {
        const isT1User = userBracketSlot.team1.id === 'user-team';
        return {
          match: userBracketSlot.match,
          userTeam: isT1User ? userBracketSlot.team1 : userBracketSlot.team2,
          opponentTeam: isT1User ? userBracketSlot.team2 : userBracketSlot.team1
        };
      }
    }

    return {};
  };

  const { match: userActiveMatch, userTeam: activeUserTeam, opponentTeam: activeOpponentTeam } =
    getUserActiveMatchInfo();

  // Auto-simulate remaining Swiss rounds when user is already resolved (qualified 3W or eliminated 3L) in current Swiss stage
  useEffect(() => {
    if (
      major.machineState !== 'stage1_active' &&
      major.machineState !== 'stage2_active' &&
      major.machineState !== 'stage3_active'
    ) {
      return;
    }
    if (!currentSwissStage || currentSwissStage.isCompleted) return;

    const uTeam = currentSwissStage.teams.find(t => t.id === 'user-team');
    const userResolved = !uTeam || uTeam.status === 'qualified' || uTeam.status === 'eliminated';

    if (userResolved && activeView === 'standings') {
      const timer = setTimeout(() => {
        simulateCurrentSwissRoundCpuOnly();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [major.machineState, currentSwissStage?.currentRound, currentSwissStage?.isCompleted, activeView]);

  // Auto-simulate remaining Playoff rounds if user is not in playoffs or was eliminated in playoffs
  useEffect(() => {
    if (major.machineState !== 'playoffs_active' || !major.playoffs) return;
    if (userActiveMatch) return; // User has a match to play!

    const timer = setTimeout(() => {
      simulateCurrentPlayoffRoundCpuOnly();
    }, 750);
    return () => clearTimeout(timer);
  }, [major.machineState, major.playoffs?.currentRound, userActiveMatch?.id]);

  // When user finishes map veto
  const handleVetoComplete = (pickedMaps: string[]) => {
    setActiveMapsForMatch(pickedMaps);
    setActiveView('match');
  };

  // Simulate a Swiss round where user has no active match
  const simulateCurrentSwissRoundCpuOnly = () => {
    if (!currentSwissStage || major.activeStageId === 'playoffs') return;
    const stageKey = major.activeStageId;
    const roundMatches = currentSwissStage.matchesByRound[currentSwissStage.currentRound] || [];
    const simulatedMatches = roundMatches.map((m, idx) =>
      m.status === 'completed'
        ? m
        : simulateCpuVsCpuMatch(
            m,
            currentSwissStage.teams,
            currentSwissStage.seed + currentSwissStage.currentRound * 100 + idx * 79
          )
    );

    const nextStageState = advanceSwissStageRound(currentSwissStage, simulatedMatches);
    let nextMajor: MajorTournamentState = {
      ...major,
      stages: {
        ...major.stages,
        [stageKey]: nextStageState
      }
    };

    if (nextStageState.isCompleted) {
      nextMajor = completeCurrentSwissStage(nextMajor);
    }

    setMajor(nextMajor);
    setActiveView('standings');
  };

  // Simulate current Playoff round matches that do not involve the user
  const simulateCurrentPlayoffRoundCpuOnly = () => {
    if (!major.playoffs) return;
    const pb = major.playoffs;
    const activeSlots: PlayoffBracketMatch[] =
      pb.currentRound === 'quarterfinals'
        ? pb.quarterfinals
        : pb.currentRound === 'semifinals'
        ? pb.semifinals
        : pb.currentRound === 'grand_final'
        ? [pb.grandFinal]
        : [];

    let updatedMajor = { ...major };
    activeSlots.forEach((slot, idx) => {
      if (!slot.match || slot.match.status === 'completed' || !slot.team1 || !slot.team2) return;
      const simMatch = simulateCpuVsCpuMatch(
        slot.match,
        [slot.team1, slot.team2],
        major.seed + idx * 149 + (pb.currentRound === 'grand_final' ? 900 : 400)
      );
      updatedMajor = recordPlayoffMatchResult(updatedMajor, simMatch);
    });

    setMajor(updatedMajor);
    setActiveView('standings');

    if (updatedMajor.machineState === 'tournament_complete') {
      syncCampaignCompletion(updatedMajor);
    }
  };

  // Handle completion of user's match (either in Swiss Stage 1/2/3 or in Playoffs)
  const handleMatchComplete = (completedUserMatch: TournamentMatch) => {
    if (major.activeStageId !== 'playoffs' && currentSwissStage) {
      const stageKey = major.activeStageId;
      const roundMatches = currentSwissStage.matchesByRound[currentSwissStage.currentRound] || [];
      const simulatedCpuMatches = roundMatches
        .filter(m => m.id !== completedUserMatch.id)
        .map((cpuMatch, idx) =>
          simulateCpuVsCpuMatch(
            cpuMatch,
            currentSwissStage.teams,
            currentSwissStage.seed + currentSwissStage.currentRound * 100 + idx * 79
          )
        );

      const allRoundCompleted = [completedUserMatch, ...simulatedCpuMatches];
      const nextStageState = advanceSwissStageRound(currentSwissStage, allRoundCompleted);

      let nextMajor: MajorTournamentState = {
        ...major,
        stages: {
          ...major.stages,
          [stageKey]: nextStageState
        }
      };

      if (nextStageState.isCompleted) {
        nextMajor = completeCurrentSwissStage(nextMajor);
      }

      setMajor(nextMajor);
      setActiveView('standings');

      const uTeam = nextStageState.teams.find(t => t.id === 'user-team');
      if (uTeam) {
        onUpdateCampaign({
          ...campaign,
          userWins: uTeam.wins,
          userLosses: uTeam.losses,
          swissRound: nextStageState.currentRound
        });

        if (uTeam.status === 'qualified' && currentSwissStage.userStatus === 'active') {
          sound.playVictoryFanfare();
        } else if (uTeam.status === 'eliminated' && currentSwissStage.userStatus === 'active') {
          sound.playRoundLoss();
        }
      }
      return;
    }

    // Playoff match completion
    if (major.activeStageId === 'playoffs' && major.playoffs) {
      const pb = major.playoffs;
      const activeSlots: PlayoffBracketMatch[] =
        pb.currentRound === 'quarterfinals'
          ? pb.quarterfinals
          : pb.currentRound === 'semifinals'
          ? pb.semifinals
          : pb.currentRound === 'grand_final'
          ? [pb.grandFinal]
          : [];

      let nextMajor = recordPlayoffMatchResult(major, completedUserMatch);

      // Also simulate all other CPU vs CPU matches in the same playoff round
      activeSlots.forEach((slot, idx) => {
        if (!slot.match || slot.match.id === completedUserMatch.id || slot.match.status === 'completed') return;
        if (!slot.team1 || !slot.team2) return;
        const simCpu = simulateCpuVsCpuMatch(
          slot.match,
          [slot.team1, slot.team2],
          major.seed + idx * 173 + (pb.currentRound === 'semifinals' ? 500 : 200)
        );
        nextMajor = recordPlayoffMatchResult(nextMajor, simCpu);
      });

      setMajor(nextMajor);
      setActiveView('standings');

      if (completedUserMatch.winnerId === 'user-team') {
        sound.playVictoryFanfare();
        if (nextMajor.machineState === 'tournament_complete') {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        }
      } else {
        sound.playRoundLoss();
      }

      if (nextMajor.machineState === 'tournament_complete') {
        syncCampaignCompletion(nextMajor);
      }
    }
  };

  const syncCampaignCompletion = (finalMajor: MajorTournamentState) => {
    const isChamp = finalMajor.champion?.id === 'user-team';
    onUpdateCampaign({
      ...campaign,
      isSwissFinished: true,
      isQualifiedForPlayoffs: !!finalMajor.playoffs?.seededTeams.some(t => t.id === 'user-team'),
      isChampion: isChamp,
      status: 'completed'
    });
  };

  // User confirms stage transition button ("Continuar para Stage 2" / "Continuar para Stage 3" / "Ir para os playoffs")
  const handleConfirmNextStage = () => {
    sound.playClick();
    const nextMajor = advanceToNextMajorStage(major, 'high_vs_low');
    setMajor(nextMajor);
    setSelectedNavStage(nextMajor.activeStageId);

    // Check if user has an active match in the newly created stage
    const nextSwiss = nextMajor.activeStageId !== 'playoffs' ? nextMajor.stages[nextMajor.activeStageId] : undefined;
    const userInNextSwiss = nextSwiss?.teams.some(t => t.id === 'user-team');
    const userInPlayoffs = nextMajor.playoffs?.seededTeams.some(t => t.id === 'user-team');

    if ((nextSwiss && userInNextSwiss) || (nextMajor.activeStageId === 'playoffs' && userInPlayoffs)) {
      setActiveView('veto');
    } else {
      setActiveView('standings');
    }
  };

  const handleStartNextMatch = () => {
    sound.playClick();
    if (userActiveMatch) {
      setSelectedNavStage(major.activeStageId);
      setActiveView('veto');
    } else if (currentSwissStage && !currentSwissStage.isCompleted) {
      simulateCurrentSwissRoundCpuOnly();
    } else if (major.activeStageId === 'playoffs' && major.machineState === 'playoffs_active') {
      simulateCurrentPlayoffRoundCpuOnly();
    }
  };

  // Stage availability for navigation bar
  const isStageAvailable = (stageId: MajorStageId): boolean => {
    if (stageId === 'stage1') return true;
    if (stageId === 'stage2') return !!major.stages.stage2;
    if (stageId === 'stage3') return !!major.stages.stage3;
    if (stageId === 'playoffs') return !!major.playoffs;
    return false;
  };

  // Compute user summary across all stages for Champion / Completion screen
  const getUserPerformanceSummary = () => {
    const stagesSummary: Array<{ label: string; record: string; status: string }> = [];
    (['stage1', 'stage2', 'stage3'] as const).forEach(sKey => {
      const st = major.stages[sKey];
      if (!st) return;
      const u = st.teams.find(t => t.id === 'user-team');
      if (u) {
        stagesSummary.push({
          label: STAGE_LABELS[sKey],
          record: `${u.wins}-${u.losses}`,
          status: u.status === 'qualified' ? 'Classificado' : u.status === 'eliminated' ? 'Eliminado' : 'Em andamento'
        });
      } else {
        stagesSummary.push({
          label: STAGE_LABELS[sKey],
          record: '—',
          status: 'Não participou'
        });
      }
    });

    if (major.playoffs) {
      const inPlayoffs = major.playoffs.seededTeams.some(t => t.id === 'user-team');
      if (!inPlayoffs) {
        stagesSummary.push({ label: 'Playoffs', record: '—', status: 'Não classificou' });
      } else if (major.champion?.id === 'user-team') {
        stagesSummary.push({ label: 'Playoffs', record: '3-0', status: 'Campeão do Major' });
      } else if (major.runnerUp?.id === 'user-team') {
        stagesSummary.push({ label: 'Playoffs', record: '2-1', status: 'Vice-campeão' });
      } else {
        const wonQF = major.playoffs.quarterfinals.some(q => q.match?.winnerId === 'user-team');
        stagesSummary.push({
          label: 'Playoffs',
          record: wonQF ? '1-1' : '0-1',
          status: wonQF ? 'Semifinalista' : 'Quartas de final'
        });
      }
    }

    return stagesSummary;
  };

  // Compute cumulative HLTV 2.0 player rating averages across all matches, maps, and rounds played in the tournament
  const getTournamentPlayerRatings = (team: TournamentTeam) => {
    const allCompletedMatches: TournamentMatch[] = [];
    (['stage1', 'stage2', 'stage3'] as const).forEach(sKey => {
      const st = major.stages[sKey];
      if (st?.completedMatches) {
        allCompletedMatches.push(...st.completedMatches);
      }
    });
    if (major.playoffs) {
      major.playoffs.quarterfinals.forEach(q => {
        if (q.match?.status === 'completed') allCompletedMatches.push(q.match);
      });
      major.playoffs.semifinals.forEach(s => {
        if (s.match?.status === 'completed') allCompletedMatches.push(s.match);
      });
      if (major.playoffs.grandFinal.match?.status === 'completed') {
        allCompletedMatches.push(major.playoffs.grandFinal.match);
      }
    }

    const teamMatches = allCompletedMatches.filter(
      m => m.team1Id === team.id || m.team2Id === team.id
    );

    const ratingSumByPlayer: Record<string, number> = {};
    const roundCountByPlayer: Record<string, number> = {};
    let totalMapsPlayed = 0;

    teamMatches.forEach(m => {
      m.mapResults.forEach(mapRes => {
        totalMapsPlayed++;
        mapRes.rounds.forEach(rnd => {
          if (!rnd.playerRoundRatings) return;
          team.roster.forEach(p => {
            const val = rnd.playerRoundRatings?.[p.id];
            if (val !== undefined) {
              ratingSumByPlayer[p.id] = (ratingSumByPlayer[p.id] || 0) + val;
              roundCountByPlayer[p.id] = (roundCountByPlayer[p.id] || 0) + 1;
            }
          });
        });
      });
    });

    const stats = team.roster.slice(0, 5).map(player => {
      const rounds = roundCountByPlayer[player.id] || 0;
      const avgRating =
        rounds > 0 ? Math.round((ratingSumByPlayer[player.id] / rounds) * 100) / 100 : undefined;
      return {
        player,
        avgRating,
        roundsPlayed: rounds,
        mapsPlayed: totalMapsPlayed,
        matchesPlayed: teamMatches.length
      };
    });

    return stats.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  };

  const renderStageTransitionCard = (stageKey: 'stage1' | 'stage2' | 'stage3') => {
    const st = major.stages[stageKey];
    if (!st) return null;

    const qualifiers = rankSwissQualifiers(st.teams);
    const eliminated = st.teams
      .filter(t => t.status === 'eliminated')
      .sort((a, b) => b.wins - a.wins || b.ovr - a.ovr);

    const nextActionLabel =
      stageKey === 'stage1'
        ? 'Continuar para Stage 2'
        : stageKey === 'stage2'
        ? 'Continuar para Stage 3'
        : 'Ir para os playoffs';

    return (
      <div className="bg-cs-surface border border-cs-border rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cs-border pb-4">
          <div>
            <span className="text-xs font-semibold text-cs-accent block">
               Etapa concluída
            </span>
            <h2 className="text-2xl font-display font-black text-white">
              {STAGE_LABELS[stageKey]} Finalizado
            </h2>
            <p className="text-xs text-cs-muted mt-0.5">
              8 equipes avançam para a próxima fase e 8 equipes estão eliminadas do Major.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmNextStage}
            className="px-6 py-3 rounded-xl bg-cs-accent hover:bg-cs-accentHover active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black font-display font-black text-sm whitespace-nowrap transition-colors shadow-md flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            <span>{nextActionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 8 Qualified Teams */}
          <div className="bg-cs-card border border-cs-green/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-cs-border pb-2">
              <span className="text-xs font-bold text-cs-green flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Classificados (8 equipes)
              </span>
              <span className="text-xs text-cs-muted">Campanha</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {qualifiers.map((team, idx) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    team.isUser
                      ? 'bg-cs-green/15 border-cs-green text-white'
                      : 'bg-cs-surface border-cs-border text-cs-text'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-cs-muted w-4">#{idx + 1}</span>
                    <TeamLogo
                      teamId={team.id}
                      name={team.name}
                      logoText={team.logoText}
                      accentColor={team.accentColor}
                      size="sm"
                      className="w-6 h-6 rounded-full shrink-0"
                    />
                    <span className="text-xs font-bold truncate">{team.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cs-green ml-2 shrink-0">
                    {team.wins}-{team.losses}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 8 Eliminated Teams */}
          <div className="bg-cs-card border border-cs-red/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-cs-border pb-2">
              <span className="text-xs font-bold text-cs-red flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Eliminados (8 equipes)
              </span>
              <span className="text-xs text-cs-muted">Campanha</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eliminated.map(team => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-2 rounded-lg border opacity-75 ${
                    team.isUser
                      ? 'bg-cs-red/15 border-cs-red text-white'
                      : 'bg-cs-surface border-cs-border text-cs-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo
                      teamId={team.id}
                      name={team.name}
                      logoText={team.logoText}
                      accentColor={team.accentColor}
                      size="sm"
                      className="w-6 h-6 rounded-full shrink-0"
                    />
                    <span className="text-xs font-semibold truncate">{team.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cs-red ml-2 shrink-0">
                    {team.wins}-{team.losses}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlayoffMatchCard = (slotMatch: PlayoffBracketMatch, label: string) => {
    const t1 = slotMatch.team1;
    const t2 = slotMatch.team2;
    const m = slotMatch.match;
    const isCompleted = m?.status === 'completed';

    // Compute map wins for each side
    let t1Wins = 0;
    let t2Wins = 0;
    if (m && m.mapResults.length > 0 && t1 && t2) {
      m.mapResults.forEach(r => {
        const t1Won = t2.isUser ? r.winner === 'opponent' : r.winner === 'user';
        if (t1Won) t1Wins++;
        else t2Wins++;
      });
    }

    return (
      <div
        key={slotMatch.slot}
        className={`rounded-xl border p-3 bg-cs-card space-y-2 ${
          t1?.isUser || t2?.isUser ? 'border-cs-accent/70' : 'border-cs-border'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-semibold text-cs-muted">
          <span>{label}</span>
          <span className="px-1.5 py-0.5 rounded bg-cs-surface border border-cs-border text-cs-text">
            {slotMatch.format}
          </span>
        </div>

        {/* Team 1 Row */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border ${
            isCompleted && m?.winnerId === t1?.id
              ? 'bg-cs-green/15 border-cs-green/40 text-white'
              : 'bg-cs-surface border-cs-border/60 text-cs-text'
          }`}
        >
          {t1 ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                {slotMatch.seed1 && (
                  <span className="text-[10px] font-mono text-cs-muted">#{slotMatch.seed1}</span>
                )}
                <TeamLogo
                  teamId={t1.id}
                  name={t1.name}
                  logoText={t1.logoText}
                  accentColor={t1.accentColor}
                  size="sm"
                  className="w-5 h-5 rounded-full shrink-0"
                />
                <span className={`text-xs font-bold truncate ${t1.isUser ? 'text-cs-green' : ''}`}>
                  {t1.name}
                </span>
              </div>
              <span className="font-mono font-bold text-xs ml-2">
                {m && m.mapResults.length > 0 ? t1Wins : '—'}
              </span>
            </>
          ) : (
            <span className="text-xs text-cs-muted italic">A definir</span>
          )}
        </div>

        {/* Team 2 Row */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border ${
            isCompleted && m?.winnerId === t2?.id
              ? 'bg-cs-green/15 border-cs-green/40 text-white'
              : 'bg-cs-surface border-cs-border/60 text-cs-text'
          }`}
        >
          {t2 ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                {slotMatch.seed2 && (
                  <span className="text-[10px] font-mono text-cs-muted">#{slotMatch.seed2}</span>
                )}
                <TeamLogo
                  teamId={t2.id}
                  name={t2.name}
                  logoText={t2.logoText}
                  accentColor={t2.accentColor}
                  size="sm"
                  className="w-5 h-5 rounded-full shrink-0"
                />
                <span className={`text-xs font-bold truncate ${t2.isUser ? 'text-cs-green' : ''}`}>
                  {t2.name}
                </span>
              </div>
              <span className="font-mono font-bold text-xs ml-2">
                {m && m.mapResults.length > 0 ? t2Wins : '—'}
              </span>
            </>
          ) : (
            <span className="text-xs text-cs-muted italic">A definir</span>
          )}
        </div>

        {slotMatch.nextSlot && (
          <div className="text-[10px] text-cs-muted text-right">
            Vencedor avança para {slotMatch.nextSlot === 'GF' ? 'Grande Final' : slotMatch.nextSlot}
          </div>
        )}
      </div>
    );
  };

  const renderChampionScreen = () => {
    if (major.machineState !== 'tournament_complete' || !major.playoffs || !major.champion) {
      return null;
    }

    const champ = major.champion;
    const runner = major.runnerUp;
    const gfMatch = major.playoffs.grandFinal.match;
    const gfTeam1 = major.playoffs.grandFinal.team1;
    const gfTeam2 = major.playoffs.grandFinal.team2;

    let champMaps = 0;
    let runnerMaps = 0;
    if (gfMatch && gfTeam1 && gfTeam2) {
      gfMatch.mapResults.forEach(r => {
        const t1Won = gfTeam2.isUser ? r.winner === 'opponent' : r.winner === 'user';
        const mapWinnerId = t1Won ? gfTeam1.id : gfTeam2.id;
        if (mapWinnerId === champ.id) champMaps++;
        else runnerMaps++;
      });
    }

    const userSummary = getUserPerformanceSummary();
    const userPlayerStats = getTournamentPlayerRatings(major.userTeamBase);
    const champPlayerStats = champ.id !== 'user-team' ? getTournamentPlayerRatings(champ) : null;

    return (
      <div className="bg-cs-surface border-2 border-cs-accent rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cs-accent/20 border border-cs-accent flex items-center justify-center text-cs-accent">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="text-xs font-semibold text-cs-accent">
            Campeão do Major (Grande Final BO5)
          </span>

          <div className="flex items-center gap-3">
            <TeamLogo
              teamId={champ.id}
              name={champ.name}
              logoText={champ.logoText}
              accentColor={champ.accentColor}
              size="lg"
              className="w-16 h-16 rounded-full"
            />
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white">
                {champ.name}
              </h2>
              <p className="text-xs text-cs-muted">
                Overall {champ.ovr} · Placar da Final: <span className="font-mono font-bold text-cs-accent">{champMaps} - {runnerMaps}</span> vs {runner?.name}
              </p>
            </div>
          </div>
        </div>

        {/* BO5 Map Results Breakdown */}
        {gfMatch && gfMatch.mapResults.length > 0 && (
          <div className="bg-cs-card border border-cs-border rounded-xl p-4 max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-cs-muted block">
              Mapas da Grande Final (MD5)
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {gfMatch.mapResults.map((mr, i) => {
                const t1Score = gfTeam2?.isUser ? mr.opponentScore : mr.userScore;
                const t2Score = gfTeam2?.isUser ? mr.userScore : mr.opponentScore;
                return (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-cs-surface border border-cs-border text-xs flex items-center gap-2"
                  >
                    <span className="font-bold text-white">Mapa {i + 1}: {mr.mapName}</span>
                    <span className="font-mono text-cs-accent">
                      {gfTeam1?.shortName} {t1Score} - {t2Score} {gfTeam2?.shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Team Summary across all 4 stages */}
        <div className="bg-cs-card border border-cs-border rounded-xl p-4 max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between border-b border-cs-border pb-2">
            <span className="text-xs font-bold text-cs-green flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Resumo da sua equipe ({major.userTeamBase.name})
            </span>
            <span className="text-xs text-cs-muted">Desempenho nas 4 fases</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {userSummary.map(item => (
              <div key={item.label} className="p-3 rounded-lg bg-cs-surface border border-cs-border text-left">
                <span className="text-[11px] font-semibold text-cs-muted block">{item.label}</span>
                <span className="font-display font-black text-lg text-white">{item.record}</span>
                <span className="text-[11px] text-cs-accent block mt-0.5">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Tournament Player Ratings (All Games Played) */}
        <div className="bg-cs-card border border-cs-border rounded-xl p-4 max-w-3xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-cs-border pb-2 text-left">
            <span className="text-xs font-bold text-white">
              Média de Rating HLTV 2.0 no Torneio ({major.userTeamBase.name})
            </span>
            <span className="text-xs text-cs-muted">
              {userPlayerStats[0]?.matchesPlayed || 0} jogos, {userPlayerStats[0]?.mapsPlayed || 0} mapas ({userPlayerStats[0]?.roundsPlayed || 0} rounds)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {userPlayerStats.map((item, idx) => {
              const badge = roleBadgeConfig[item.player.role] || {
                label: item.player.role.toUpperCase(),
                bg: 'bg-cs-surface',
                text: 'text-white'
              };
              const meta = getHltvRatingMeta(item.avgRating);
              const isMvp = idx === 0 && item.avgRating !== undefined;
              return (
                <div
                  key={item.player.id}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 ${
                    isMvp
                      ? 'bg-cs-accent/10 border-cs-accent/60'
                      : 'bg-cs-surface border-cs-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    {isMvp && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cs-accent text-black">
                        MVP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CountryFlag countryCode={item.player.country} className="w-3.5 h-2.5 shrink-0" />
                    <span className="text-xs font-bold text-white truncate">
                      {item.player.nickname}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-cs-border/60 flex items-baseline justify-between">
                    <span className="text-[10px] text-cs-muted">OVR {item.player.ovr}</span>
                    <span
                      className={`font-mono font-black text-base tabular-nums ${meta.color}`}
                      title={meta.label}
                    >
                      {item.avgRating !== undefined ? item.avgRating.toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* If a CPU team won the Major, also show Champion Team Player Ratings */}
        {champPlayerStats && (
          <div className="bg-cs-card border border-cs-border rounded-xl p-4 max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-cs-border pb-2 text-left">
              <span className="text-xs font-bold text-cs-accent">
                Elenco Campeão, Rating HLTV 2.0 ({champ.name})
              </span>
              <span className="text-xs text-cs-muted">
                {champPlayerStats[0]?.matchesPlayed || 0} jogos, {champPlayerStats[0]?.mapsPlayed || 0} mapas ({champPlayerStats[0]?.roundsPlayed || 0} rounds)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {champPlayerStats.map((item, idx) => {
                const badge = roleBadgeConfig[item.player.role] || {
                  label: item.player.role.toUpperCase(),
                  bg: 'bg-cs-surface',
                  text: 'text-white'
                };
                const meta = getHltvRatingMeta(item.avgRating);
                const isMvp = idx === 0 && item.avgRating !== undefined;
                return (
                  <div
                    key={item.player.id}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 ${
                      isMvp
                        ? 'bg-cs-accent/10 border-cs-accent/60'
                        : 'bg-cs-surface border-cs-border'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      {isMvp && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cs-accent text-black">
                          MVP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CountryFlag countryCode={item.player.country} className="w-3.5 h-2.5 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        {item.player.nickname}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-cs-border/60 flex items-baseline justify-between">
                      <span className="text-[10px] text-cs-muted">OVR {item.player.ovr}</span>
                      <span
                        className={`font-mono font-black text-base tabular-nums ${meta.color}`}
                        title={meta.label}
                      >
                        {item.avgRating !== undefined ? item.avgRating.toFixed(2) : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedNavStage('stage1')}
            className="px-4 py-2.5 rounded-xl bg-cs-card hover:bg-cs-hover active:scale-[0.98] border border-cs-border text-xs font-bold text-white whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            Ver histórico
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="px-6 py-2.5 rounded-xl bg-cs-accent hover:bg-cs-accentHover active:scale-[0.98] text-black font-bold text-xs whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            Novo draft e torneio
          </button>
        </div>
      </div>
    );
  };

  const isViewingActiveStage = selectedNavStage === major.activeStageId;
  const inspectedSwissStage =
    selectedNavStage !== 'playoffs' ? major.stages[selectedNavStage] : undefined;

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto pb-10">
      {/* Major 4-Stage Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cs-surface p-3 rounded-2xl border border-cs-border">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['stage1', 'stage2', 'stage3', 'playoffs'] as MajorStageId[]).map(stageId => {
            const available = isStageAvailable(stageId);
            const isSelected = selectedNavStage === stageId;
            const isCurrentActive = major.activeStageId === stageId;
            return (
              <button
                key={stageId}
                type="button"
                disabled={!available}
                onClick={() => {
                  sound.playClick();
                  setSelectedNavStage(stageId);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none ${
                  isSelected
                    ? 'bg-cs-accent text-black'
                    : 'bg-cs-card text-cs-text hover:text-white border border-cs-border'
                }`}
              >
                <span>{STAGE_LABELS[stageId]}</span>
                {isCurrentActive && major.machineState !== 'tournament_complete' && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-black' : 'bg-cs-green'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-cs-muted px-2">
          <span>Fase atual: <strong className="text-white">{STAGE_LABELS[major.activeStageId]}</strong></span>
          {isViewingActiveStage && userActiveMatch && activeView === 'standings' && (
            <button
              type="button"
              onClick={handleStartNextMatch}
              className="px-3.5 py-1.5 rounded-lg bg-cs-green hover:bg-emerald-400 active:scale-[0.98] text-black font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cs-green focus-visible:outline-none"
            >
              <Swords className="w-3.5 h-3.5" />
              Jogar partida
            </button>
          )}
        </div>
      </div>

      {/* Champion Screen when Grand Final is complete */}
      {major.machineState === 'tournament_complete' && renderChampionScreen()}

      {/* Stage Transition Screen when a Swiss stage just finished */}
      {isViewingActiveStage &&
        (major.machineState === 'stage1_complete' ||
          major.machineState === 'stage2_complete' ||
          major.machineState === 'stage3_complete') &&
        major.activeStageId !== 'playoffs' &&
        renderStageTransitionCard(major.activeStageId)}

      {/* Active Veto / Match Simulation View when viewing current stage and user has a match */}
      {isViewingActiveStage &&
        activeView === 'veto' &&
        userActiveMatch &&
        activeUserTeam &&
        activeOpponentTeam && (
          <MapVetoView
            key={userActiveMatch.id}
            match={userActiveMatch}
            userTeam={activeUserTeam}
            opponentTeam={activeOpponentTeam}
            onVetoComplete={handleVetoComplete}
          />
        )}

      {isViewingActiveStage &&
        activeView === 'match' &&
        userActiveMatch &&
        activeUserTeam &&
        activeOpponentTeam && (
          <MatchSimulationView
            key={userActiveMatch.id}
            match={userActiveMatch}
            userTeam={activeUserTeam}
            opponentTeam={activeOpponentTeam}
            mapsToPlay={activeMapsForMatch}
            onMatchComplete={handleMatchComplete}
          />
        )}

      {/* Swiss Stage View (for Stage 1, Stage 2, or Stage 3) */}
      {selectedNavStage !== 'playoffs' && inspectedSwissStage && (
        <div className="space-y-4">
          {/* Swiss Stage Status Bar & Next Round Action */}
          {isViewingActiveStage &&
            activeView === 'standings' &&
            !inspectedSwissStage.isCompleted && (
              <div className="flex flex-col items-center justify-center p-5 bg-cs-surface border border-cs-border rounded-2xl text-center space-y-3">
                <div className="text-lg font-display font-black text-white">
                  {STAGE_LABELS[selectedNavStage]}, Rodada {inspectedSwissStage.currentRound}
                </div>
                {userActiveMatch ? (
                  <button
                    type="button"
                    onClick={handleStartNextMatch}
                    className="px-6 py-2.5 rounded-xl bg-cs-green hover:bg-emerald-400 active:scale-[0.98] text-black font-bold text-xs whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-cs-green focus-visible:outline-none"
                  >
                    <Swords className="w-4 h-4" />
                    Próxima rodada
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-cs-muted motion-safe:animate-pulse motion-reduce:animate-none">
                    <span className="w-2 h-2 rounded-full bg-cs-accent" />
                    Simulando partidas restantes do {STAGE_LABELS[selectedNavStage]}…
                  </div>
                )}
              </div>
            )}

          <SwissStandings teams={inspectedSwissStage.teams} highlightTeamId="user-team" />
        </div>
      )}

      {/* Playoffs Bracket View */}
      {selectedNavStage === 'playoffs' && major.playoffs && (
        <div className="bg-cs-surface border border-cs-border rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cs-border pb-3">
            <div>
              <h3 className="text-xl font-display font-black text-white">
                Chaveamento dos Playoffs
              </h3>
              <p className="text-xs text-cs-muted">
                Quartas e Semifinais em MD3 (BO3) · Grande Final em MD5 (BO5)
              </p>
            </div>

            {isViewingActiveStage &&
              major.machineState === 'playoffs_active' &&
              userActiveMatch &&
              activeView === 'standings' && (
                <button
                  type="button"
                  onClick={handleStartNextMatch}
                  className="px-5 py-2.5 rounded-xl bg-cs-green hover:bg-emerald-400 active:scale-[0.98] text-black font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-cs-green focus-visible:outline-none"
                >
                  <Swords className="w-4 h-4" />
                  Ir para Pick/Ban ({userActiveMatch.bracketSlot})
                </button>
              )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Column 1: Quarterfinals (4 matches) */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-cs-muted block">
                Quartas de Final (BO3)
              </span>
              {major.playoffs.quarterfinals.map((qf, i) =>
                renderPlayoffMatchCard(qf, `Quartas ${i + 1} (${qf.slot})`)
              )}
            </div>

            {/* Column 2: Semifinals (2 matches) */}
            <div className="space-y-6">
              <span className="text-xs font-semibold text-cs-muted block">
                Semifinais (BO3)
              </span>
              {major.playoffs.semifinals.map((sf, i) =>
                renderPlayoffMatchCard(
                  sf,
                  i === 0 ? 'Semifinal 1 (QF1 vs QF2)' : 'Semifinal 2 (QF3 vs QF4)'
                )
              )}
            </div>

            {/* Column 3: Grand Final (1 BO5 match) */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-cs-accent block">
                Grande Final (BO5)
              </span>
              {renderPlayoffMatchCard(major.playoffs.grandFinal, 'Grande Final (SF1 vs SF2)')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
