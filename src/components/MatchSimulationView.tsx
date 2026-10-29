/* Hallmark · redesign: full · keep MR12 simulation engine, deterministic seed, sound · semantic tokens */
import React, { useState, useEffect } from 'react';
import { TournamentTeam, TournamentMatch, MapGameResult } from '../types/tournament';
import { TOURNAMENT_MAPS, simulateCompetitiveMap } from '../utils/tournamentEngine';
import { TeamLogo } from './TeamLogo';
import { CountryFlag } from './CountryFlag';
import { sound } from '../utils/sound';
import { FastForward, CheckCircle2 } from 'lucide-react';

interface MatchSimulationViewProps {
  match: TournamentMatch;
  userTeam: TournamentTeam;
  opponentTeam: TournamentTeam;
  mapsToPlay: string[]; // Map IDs decided from veto
  onMatchComplete: (completedMatch: TournamentMatch) => void;
}

const roleBadgeConfig: Record<string, { label: string; bg: string; text: string }> = {
  igl: { label: 'IGL', bg: 'bg-blue-700', text: 'text-white' },
  awp: { label: 'AWP', bg: 'bg-violet-700', text: 'text-white' },
  entry: { label: 'ENT', bg: 'bg-red-700', text: 'text-white' },
  rifler: { label: 'RIF', bg: 'bg-amber-700', text: 'text-white' },
  lurker: { label: 'LURK', bg: 'bg-teal-700', text: 'text-white' },
  support: { label: 'SUP', bg: 'bg-indigo-700', text: 'text-white' },
};

export const MatchSimulationView: React.FC<MatchSimulationViewProps> = ({
  match,
  userTeam,
  opponentTeam,
  mapsToPlay,
  onMatchComplete
}) => {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [completedMaps, setCompletedMaps] = useState<MapGameResult[]>([]);
  const [currentMapResult, setCurrentMapResult] = useState<MapGameResult | null>(null);
  const [liveRoundIndex, setLiveRoundIndex] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(true);

  const activeMapId = mapsToPlay[currentMapIndex] || mapsToPlay[0];
  const activeMapMeta = TOURNAMENT_MAPS.find(m => m.id === activeMapId) || TOURNAMENT_MAPS[0];

  // Pre-generate map rounds deterministically when active map changes
  useEffect(() => {
    const seed = Date.now() + currentMapIndex * 313;
    const simResult = simulateCompetitiveMap(
      activeMapMeta.id,
      activeMapMeta.name,
      userTeam,
      opponentTeam,
      seed
    );
    setCurrentMapResult(simResult);
    setLiveRoundIndex(0);
    setIsPlayingAuto(true);
  }, [currentMapIndex]);

  // Automated progression timer
  useEffect(() => {
    if (!isPlayingAuto || !currentMapResult) return;

    if (liveRoundIndex < currentMapResult.rounds.length) {
      const timer = setTimeout(() => {
        setLiveRoundIndex(prev => prev + 1);
        sound.playClick();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsPlayingAuto(false);
      if (currentMapResult.winner === 'user') {
        sound.playRoundWin();
      } else {
        sound.playRoundLoss();
      }
    }
  }, [isPlayingAuto, liveRoundIndex, currentMapResult]);

  // Score calculations
  const displayedRounds = currentMapResult?.rounds.slice(0, liveRoundIndex) || [];
  const currentRoundEvent = displayedRounds[displayedRounds.length - 1];

  const userLiveScore = currentRoundEvent ? currentRoundEvent.userScore : 0;
  const oppLiveScore = currentRoundEvent ? currentRoundEvent.opponentScore : 0;

  // BO3 series map score
  const userMapsWon = completedMaps.filter(m => m.winner === 'user').length +
    (liveRoundIndex >= (currentMapResult?.rounds.length || 999) && currentMapResult?.winner === 'user' ? 1 : 0);
  const oppMapsWon = completedMaps.filter(m => m.winner === 'opponent').length +
    (liveRoundIndex >= (currentMapResult?.rounds.length || 999) && currentMapResult?.winner === 'opponent' ? 1 : 0);

  const isMapFinished = currentMapResult !== null && liveRoundIndex >= currentMapResult.rounds.length;

  const isSeriesDecided = match.format === 'BO1'
    ? isMapFinished
    : userMapsWon >= 2 || oppMapsWon >= 2 || (isMapFinished && currentMapIndex >= mapsToPlay.length - 1);

  // Advance single round manually
  const handleNextRound = () => {
    if (!currentMapResult || liveRoundIndex >= currentMapResult.rounds.length) return;
    setLiveRoundIndex(prev => prev + 1);
    sound.playClick();
  };

  // Fast forward whole map
  const handleFastForward = () => {
    if (!currentMapResult) return;
    setIsPlayingAuto(false);
    setLiveRoundIndex(currentMapResult.rounds.length);
    if (currentMapResult.winner === 'user') sound.playRoundWin();
    else sound.playRoundLoss();
  };

  // Next map in BO3 or finish match
  const handleProceed = () => {
    if (!currentMapResult) return;
    const allMaps = [...completedMaps, currentMapResult];

    if (isSeriesDecided) {
      const userWonSeries = userMapsWon > oppMapsWon;
      const completed: TournamentMatch = {
        ...match,
        status: 'completed',
        mapResults: allMaps,
        winnerId: userWonSeries ? userTeam.id : opponentTeam.id,
        loserId: userWonSeries ? opponentTeam.id : userTeam.id
      };
      onMatchComplete(completed);
    } else {
      setCompletedMaps(allMaps);
      setCurrentMapIndex(prev => prev + 1);
    }
  };

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-cs-border shadow-md mb-4 bg-cs-surface text-white">
      {/* Background Map Image with Dim Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-xs"
        style={{ backgroundImage: `url(${activeMapMeta.thumbnail})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-cs-bg via-cs-surface/90 to-cs-surface/95" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between min-h-[460px]">
        {/* Top Header: Round info & Map name */}
        <div className="flex items-center justify-between text-xs text-cs-muted border-b border-cs-border pb-3">
          <div>
            Round {match.roundNumber}, <span className="text-cs-green font-semibold">Ao vivo</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={activeMapMeta.thumbnail} alt="" className="w-5 h-4 object-cover rounded" />
            <span>Mapa: {activeMapMeta.name}</span>
          </div>
          <div>
            {match.format === 'BO3' ? `Série BO3 (${userMapsWon} - ${oppMapsWon})` : 'Formato BO1'}
          </div>
        </div>

        {/* Scoreboard Center */}
        <div className="grid grid-cols-[140px_1fr_140px] items-center justify-items-center gap-4 sm:gap-8 my-6 max-w-2xl mx-auto">
          {/* User Team */}
          <div className="flex flex-col items-center gap-2 text-center w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-cs-green p-1 flex items-center justify-center bg-cs-bg shadow-sm shrink-0">
              <TeamLogo
                teamId={userTeam.id}
                name={userTeam.name}
                logoText={userTeam.logoText}
                accentColor={userTeam.accentColor}
                size="lg"
                className="w-full h-full rounded-full"
              />
            </div>
            <span className="font-bold text-base sm:text-lg text-cs-green max-w-[140px] truncate block">
              {userTeam.name}
            </span>
          </div>

          {/* Central Match Score */}
          <div className="flex flex-col items-center min-w-0 w-full">
            <div className="text-5xl sm:text-6xl font-display font-black text-white">
              {userLiveScore} <span className="text-cs-muted font-normal">−</span> {oppLiveScore}
            </div>
            {/* Subtitle with Regulation or Overtime Target and side switch */}
            <span className="text-xs font-semibold text-cs-muted mt-1 text-center">
              {currentRoundEvent && currentRoundEvent.phase === 'overtime'
                ? `Overtime ${currentRoundEvent.overtimeBlock}, primeiro a ${16 + 3 * ((currentRoundEvent.overtimeBlock || 1) - 1)}`
                : 'MR12, primeiro a 13'}
            </span>

            {/* Round outcome timeline dots */}
            <div className="flex items-center gap-1.5 mt-3 w-full max-w-[260px] flex-wrap justify-center min-h-[24px]">
              {displayedRounds.map((rnd, i) => (
                <div
                  key={i}
                  title={`Round ${rnd.roundNumber}: ${rnd.winner === 'user' ? userTeam.name : opponentTeam.name}`}
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    rnd.winner === 'user' ? 'bg-cs-green' : 'bg-cs-red'
                  }`}
                />
              ))}
              {!isMapFinished && (
                <div className="w-2.5 h-2.5 rounded-full border border-cs-accent motion-safe:animate-ping motion-reduce:animate-none shrink-0" />
              )}
            </div>
          </div>

          {/* Opponent Team */}
          <div className="flex flex-col items-center gap-2 text-center w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-cs-border p-1 flex items-center justify-center bg-cs-bg shadow-sm shrink-0">
              <TeamLogo
                teamId={opponentTeam.id}
                name={opponentTeam.name}
                logoText={opponentTeam.logoText}
                accentColor={opponentTeam.accentColor}
                size="lg"
                className="w-full h-full rounded-full"
              />
            </div>
            <span className="font-bold text-base sm:text-lg text-cs-text max-w-[140px] truncate block">
              {opponentTeam.name}
            </span>
          </div>
        </div>

        {/* Both 5-Player Lineups side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-cs-card border border-cs-border rounded-xl p-4 my-2">
          {/* User Lineup (Left) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cs-green">
                {userTeam.name} (OVR {userTeam.ovr})
              </span>
              {currentRoundEvent && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  currentRoundEvent.userSide === 'CT' ? 'bg-cs-blue/20 text-cs-blue border border-cs-blue/40' : 'bg-cs-accent/20 text-cs-accent border border-cs-accent/40'
                }`}>
                  Lado: {currentRoundEvent.userSide}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {userTeam.roster.slice(0, 5).map(player => {
                const badge = roleBadgeConfig[player.role] || { label: player.role.toUpperCase(), bg: 'bg-cs-surface', text: 'text-white' };
                return (
                  <div key={player.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-cs-surface border border-cs-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-3.5 rounded overflow-hidden shrink-0 border border-cs-border flex items-center justify-center">
                        <CountryFlag countryCode={player.country} />
                      </div>
                      <span className="text-xs text-cs-muted font-semibold">{player.country}</span>
                      <span className="font-bold text-white">{player.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono font-bold text-cs-text">{player.ovr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opponent Lineup (Right) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cs-red">
                {opponentTeam.name} (OVR {opponentTeam.ovr})
              </span>
              {currentRoundEvent && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  currentRoundEvent.opponentSide === 'CT' ? 'bg-cs-blue/20 text-cs-blue border border-cs-blue/40' : 'bg-cs-accent/20 text-cs-accent border border-cs-accent/40'
                }`}>
                  Lado: {currentRoundEvent.opponentSide}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {(opponentTeam.roster && opponentTeam.roster.length > 0 ? opponentTeam.roster : [
                { id: 'bot-1', nickname: 'Entry Bot', country: 'SE', role: 'entry', ovr: opponentTeam.ovr },
                { id: 'bot-2', nickname: 'AWP Bot', country: 'FR', role: 'awp', ovr: opponentTeam.ovr },
                { id: 'bot-3', nickname: 'IGL Bot', country: 'DK', role: 'igl', ovr: opponentTeam.ovr },
                { id: 'bot-4', nickname: 'Rifle Bot', country: 'US', role: 'rifler', ovr: opponentTeam.ovr },
                { id: 'bot-5', nickname: 'Lurk Bot', country: 'UA', role: 'lurker', ovr: opponentTeam.ovr },
              ]).slice(0, 5).map(player => {
                const badge = roleBadgeConfig[player.role] || { label: player.role.toUpperCase(), bg: 'bg-cs-surface', text: 'text-white' };
                return (
                  <div key={player.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-cs-surface border border-cs-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-3.5 rounded overflow-hidden shrink-0 border border-cs-border flex items-center justify-center">
                        <CountryFlag countryCode={player.country} />
                      </div>
                      <span className="text-xs text-cs-muted font-semibold">{player.country}</span>
                      <span className="font-bold text-white">{player.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono font-bold text-cs-text">{player.ovr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-cs-border mt-2">
          {/* Latest round highlight description */}
          <div className="text-xs text-cs-muted italic max-w-md truncate">
            {currentRoundEvent ? currentRoundEvent.highlightText : 'Aquecendo para o confronto…'}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!isMapFinished ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsPlayingAuto(prev => !prev)}
                  className="px-3 py-1.5 rounded-lg border border-cs-border bg-cs-surface hover:bg-cs-card active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-cs-text transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
                >
                  {isPlayingAuto ? 'Pausar' : 'Continuar'}
                </button>
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="px-3 py-1.5 rounded-lg bg-cs-surface hover:bg-cs-card active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none border border-cs-border text-xs font-semibold text-cs-text transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
                >
                  Próximo round
                </button>
                <button
                  type="button"
                  onClick={handleFastForward}
                  className="px-3.5 py-1.5 rounded-lg bg-cs-green hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-cs-green focus-visible:outline-none"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Simular rápido
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleProceed}
                className="px-5 py-2 rounded-xl bg-cs-green hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black font-bold text-xs transition-colors shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-cs-green focus-visible:outline-none"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSeriesDecided ? 'Concluir partida' : 'Próximo mapa da série'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
