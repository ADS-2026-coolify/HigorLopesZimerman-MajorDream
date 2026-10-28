import React, { useState, useEffect } from 'react';
import { CampaignState } from '../types';
import {
  SwissTournamentState,
  TournamentTeam,
  TournamentMatch
} from '../types/tournament';
import {
  initialize16Teams,
  generateSwissPairings,
  simulateCpuVsCpuMatch,
  updateTournamentStandings
} from '../utils/tournamentEngine';
import { SwissStandings } from './SwissStandings';
import { MapVetoView } from './MapVetoView';
import { MatchSimulationView } from './MatchSimulationView';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { Trophy, Swords, Zap, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface SimulationCampaignProps {
  campaign: CampaignState;
  onUpdateCampaign: (updated: CampaignState) => void;
  onRestart: () => void;
}

export const SimulationCampaign: React.FC<SimulationCampaignProps> = ({
  campaign,
  onUpdateCampaign,
  onRestart
}) => {
  const STORAGE_KEY = `draftarena_swiss_${campaign.campaignId}`;

  // Initialize or restore Swiss tournament state
  const [tournament, setTournament] = useState<SwissTournamentState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved tournament', e);
      }
    }

    // Initialize fresh 16-team tournament
    const initialSeed = Date.now();
    const teams = initialize16Teams(
      campaign.teamName,
      campaign.lineup,
      campaign.overallOvr,
      campaign.mapPoints,
      initialSeed,
      campaign.baseProficiencies
    );

    const round1Pairings = generateSwissPairings(teams, [], 1, initialSeed);

    return {
      tournamentId: campaign.campaignId,
      seed: initialSeed,
      currentRound: 1,
      teams,
      matchesByRound: { 1: round1Pairings },
      completedMatches: [],
      isCompleted: false,
      userStatus: 'active'
    };
  });

  // Current view state inside tournament: 'veto' | 'match' | 'standings'
  const [activeStage, setActiveStage] = useState<'standings' | 'veto' | 'match'>('veto');
  const [activeMapsForMatch, setActiveMapsForMatch] = useState<string[]>([]);

  // Persist tournament state on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
  }, [tournament, STORAGE_KEY]);

  // Find user's match in current round
  const currentRoundMatches = tournament.matchesByRound[tournament.currentRound] || [];
  const userMatch = currentRoundMatches.find(
    m => m.team1Id === 'user-team' || m.team2Id === 'user-team'
  );

  const userTeam = tournament.teams.find(t => t.id === 'user-team')!;
  const opponentId = userMatch
    ? (userMatch.team1Id === 'user-team' ? userMatch.team2Id : userMatch.team1Id)
    : '';
  const opponentTeam = tournament.teams.find(t => t.id === opponentId);

  // When user finishes map veto
  const handleVetoComplete = (pickedMaps: string[]) => {
    setActiveMapsForMatch(pickedMaps);
    setActiveStage('match');
  };

  // When user finishes match simulation
  const handleMatchComplete = (completedUserMatch: TournamentMatch) => {
    // 1. Simulate all other matches of this round (CPU vs CPU)
    const simulatedCpuMatches = currentRoundMatches
      .filter(m => m.id !== completedUserMatch.id)
      .map((cpuMatch, idx) => simulateCpuVsCpuMatch(cpuMatch, tournament.teams, tournament.seed + idx * 79));

    const allRoundCompleted = [completedUserMatch, ...simulatedCpuMatches];
    const newCompletedMatches = [...tournament.completedMatches, ...allRoundCompleted];

    // 2. Update standings and determine qualified/eliminated teams
    const updatedTeams = updateTournamentStandings(tournament.teams, newCompletedMatches);
    const updatedUser = updatedTeams.find(t => t.id === 'user-team')!;

    // 3. Check tournament completion:
    // A Swiss tournament is only complete when NO teams are active (all 16 are either qualified or eliminated) or round reaches max 5
    const remainingActiveTeams = updatedTeams.filter(t => t.status === 'active');
    const isTournamentOver = remainingActiveTeams.length === 0 || tournament.currentRound >= 5;

    let nextRound = tournament.currentRound;
    let newMatchesByRound = { ...tournament.matchesByRound, [tournament.currentRound]: allRoundCompleted };

    if (!isTournamentOver) {
      nextRound = tournament.currentRound + 1;
      const nextPairings = generateSwissPairings(
        updatedTeams,
        newCompletedMatches,
        nextRound,
        tournament.seed + nextRound * 997
      );
      newMatchesByRound[nextRound] = nextPairings;
    }

    const newTournamentState: SwissTournamentState = {
      ...tournament,
      currentRound: nextRound,
      teams: updatedTeams,
      matchesByRound: newMatchesByRound,
      completedMatches: newCompletedMatches,
      isCompleted: isTournamentOver,
      userStatus: updatedUser.status
    };

    setTournament(newTournamentState);
    setActiveStage('standings');

    // Sync back to top-level campaign state
    const updatedCampaign: CampaignState = {
      ...campaign,
      userWins: updatedUser.wins,
      userLosses: updatedUser.losses,
      swissRound: nextRound,
      isSwissFinished: isTournamentOver,
      isQualifiedForPlayoffs: updatedUser.status === 'qualified',
      status: isTournamentOver ? 'completed' : 'swiss'
    };
    onUpdateCampaign(updatedCampaign);

    if (updatedUser.status === 'qualified') {
      sound.playVictoryFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } else if (updatedUser.status === 'eliminated') {
      sound.playRoundLoss();
    }
  };

  // Automatically simulate remaining Swiss rounds when user is qualified or eliminated
  useEffect(() => {
    if (tournament.isCompleted) return;
    if (activeStage !== 'standings') return;

    if (userTeam.status === 'qualified' || userTeam.status === 'eliminated') {
      const timer = setTimeout(() => {
        simulateActiveCpuRound();
      }, 900); // 900ms delay so user sees standings update gracefully round by round
      return () => clearTimeout(timer);
    }
  }, [tournament.isCompleted, activeStage, userTeam.status, tournament.currentRound]);

  // Advance to next round: if user is still active, enter veto; if user is already qualified/eliminated, simulate the active CPU matchups
  const handleStartNextRound = () => {
    sound.playClick();
    if (userTeam.status === 'active' && userMatch) {
      setActiveStage('veto');
    } else {
      simulateActiveCpuRound();
    }
  };

  // Simulate a round where user is already resolved (qualified or eliminated)
  const simulateActiveCpuRound = () => {
    const roundMatches = tournament.matchesByRound[tournament.currentRound] || [];
    const simulatedMatches = roundMatches.map((m, idx) =>
      simulateCpuVsCpuMatch(m, tournament.teams, tournament.seed + tournament.currentRound * 100 + idx * 79)
    );

    const newCompletedMatches = [...tournament.completedMatches, ...simulatedMatches];
    const updatedTeams = updateTournamentStandings(tournament.teams, newCompletedMatches);
    const updatedUser = updatedTeams.find(t => t.id === 'user-team')!;

    const remainingActiveTeams = updatedTeams.filter(t => t.status === 'active');
    const isTournamentOver = remainingActiveTeams.length === 0 || tournament.currentRound >= 5;

    let nextRound = tournament.currentRound;
    let newMatchesByRound = { ...tournament.matchesByRound, [tournament.currentRound]: simulatedMatches };

    if (!isTournamentOver) {
      nextRound = tournament.currentRound + 1;
      const nextPairings = generateSwissPairings(
        updatedTeams,
        newCompletedMatches,
        nextRound,
        tournament.seed + nextRound * 997
      );
      newMatchesByRound[nextRound] = nextPairings;
    }

    const newTournamentState: SwissTournamentState = {
      ...tournament,
      currentRound: nextRound,
      teams: updatedTeams,
      matchesByRound: newMatchesByRound,
      completedMatches: newCompletedMatches,
      isCompleted: isTournamentOver,
      userStatus: updatedUser.status
    };

    setTournament(newTournamentState);
    setActiveStage('standings');

    const updatedCampaign: CampaignState = {
      ...campaign,
      swissRound: nextRound,
      isSwissFinished: isTournamentOver,
      status: isTournamentOver ? 'completed' : 'swiss'
    };
    onUpdateCampaign(updatedCampaign);
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto pb-10">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-stone-500">
        <div className="flex items-center gap-2">
          <span>STAGE 1 · SWISS · 16 TIMES</span>
          {tournament.isCompleted && (
            <span className={`px-2 py-0.5 rounded font-bold ${
              tournament.userStatus === 'qualified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {tournament.userStatus === 'qualified' ? 'CLASSIFICADO (3 VITÓRIAS)' : 'ELIMINADO (3 DERROTAS)'}
            </span>
          )}
        </div>
        <div className="text-emerald-500 font-bold">
          {activeStage === 'veto' && 'SEU PICK/BAN'}
          {activeStage === 'match' && 'PARTIDA EM ANDAMENTO'}
          {activeStage === 'standings' && 'TABELA SWISS'}
        </div>
      </div>

      {/* Interactive Main Area based on current active stage */}
      {activeStage === 'veto' && userMatch && opponentTeam && (
        <MapVetoView
          match={userMatch}
          userTeam={userTeam}
          opponentTeam={opponentTeam}
          onVetoComplete={handleVetoComplete}
        />
      )}

      {activeStage === 'match' && userMatch && opponentTeam && (
        <MatchSimulationView
          match={userMatch}
          userTeam={userTeam}
          opponentTeam={opponentTeam}
          mapsToPlay={activeMapsForMatch}
          onMatchComplete={handleMatchComplete}
        />
      )}

      {/* Standings View after a match */}
      {activeStage === 'standings' && (
        <div className="flex flex-col items-center justify-center p-6 bg-[#f4efe6] dark:bg-[#18181b] border border-stone-300 dark:border-stone-800 rounded-2xl mb-2 text-center">
          <div className="text-xl font-display font-black text-stone-900 dark:text-stone-100 mb-1">
            Rodada {tournament.currentRound - (tournament.isCompleted ? 0 : 1)} Finalizada
          </div>
          <p className="text-xs font-mono text-stone-500 mb-5">
            Seu time está com retrospecto <span className="font-bold text-stone-800 dark:text-stone-200">{userTeam.wins}-{userTeam.losses}</span> no torneio Swiss.
          </p>

          {!tournament.isCompleted ? (
            <div className="flex flex-col items-center gap-3">
              {userTeam.status === 'qualified' && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-sm font-mono font-bold text-emerald-500">
                    Seu time já está CLASSIFICADO (3 vitórias)!
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-500 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Simulando rodadas restantes dos outros times automaticamente...
                  </div>
                </div>
              )}
              {userTeam.status === 'eliminated' && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-sm font-mono font-bold text-rose-500">
                    Seu time foi ELIMINADO (3 derrotas).
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-500 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Simulando rodadas restantes automaticamente...
                  </div>
                </div>
              )}
              {userTeam.status === 'active' && (
                <button
                  onClick={handleStartNextRound}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  Avançar para Próxima Rodada (Pick/Ban)
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className={`text-sm font-mono font-bold ${
                tournament.userStatus === 'qualified' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {tournament.userStatus === 'qualified'
                  ? 'Parabéns! Seu time conquistou 3 vitórias e garantiu a vaga!'
                  : 'Fim de campanha: seu time sofreu 3 derrotas e foi eliminado.'}
              </span>
              <button
                onClick={onRestart}
                className="px-6 py-2.5 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 font-mono font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Novo Draft & Torneio
              </button>
            </div>
          )}
        </div>
      )}

      {/* Swiss Standings Bracket (always visible below, matching reference screenshot) */}
      <SwissStandings teams={tournament.teams} highlightTeamId="user-team" />
    </div>
  );
};
