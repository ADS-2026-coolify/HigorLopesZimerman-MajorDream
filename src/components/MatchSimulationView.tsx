import React, { useState, useEffect } from 'react';
import { TournamentTeam, TournamentMatch, MapGameResult } from '../types/tournament';
import { TOURNAMENT_MAPS, simulateCompetitiveMap } from '../utils/tournamentEngine';
import { TeamLogo } from './TeamLogo';
import { CountryFlag } from './CountryFlag';
import { sound } from '../utils/sound';
import { Play, FastForward, CheckCircle2 } from 'lucide-react';

interface MatchSimulationViewProps {
  match: TournamentMatch;
  userTeam: TournamentTeam;
  opponentTeam: TournamentTeam;
  mapsToPlay: string[]; // Map IDs decided from veto
  onMatchComplete: (completedMatch: TournamentMatch) => void;
}

const roleBadgeConfig: Record<string, { label: string; bg: string; text: string }> = {
  igl: { label: 'IGL', bg: 'bg-[#1D4ED8]', text: 'text-white' },
  awp: { label: 'AWP', bg: 'bg-[#7C3AED]', text: 'text-white' },
  entry: { label: 'ENTRY', bg: 'bg-[#DC2626]', text: 'text-white' },
  rifler: { label: 'RIFLER', bg: 'bg-[#D97706]', text: 'text-white' },
  lurker: { label: 'LURKER', bg: 'bg-[#0D9488]', text: 'text-white' },
  support: { label: 'SUPPORT', bg: 'bg-[#4F46E5]', text: 'text-white' },
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
  const currentRoundNumber = liveRoundIndex + 1;

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
    <div className="w-full relative rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-800 shadow-xl mb-4 bg-stone-900 text-white">
      {/* Background Map Image with Dim Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-xs"
        style={{ backgroundImage: `url(${activeMapMeta.thumbnail})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/85 to-stone-900/90" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between min-h-[460px]">
        {/* Top Header: Round info & Map name */}
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-stone-400 border-b border-white/10 pb-3">
          <div>
            ROUND {match.roundNumber} · <span className="text-emerald-400 font-bold">AO VIVO</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={activeMapMeta.thumbnail} alt="" className="w-5 h-4 object-cover rounded" />
            <span>MAPA · {activeMapMeta.name}</span>
          </div>
          <div>
            {match.format === 'BO3' ? `SÉRIE BO3 (${userMapsWon} - ${oppMapsWon})` : 'FORMATO BO1'}
          </div>
        </div>

        {/* Scoreboard Center */}
        <div className="flex items-center justify-center gap-8 sm:gap-14 my-6">
          {/* User Team */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-500/80 p-1 flex items-center justify-center bg-stone-950 shadow-lg shadow-emerald-500/20">
              <TeamLogo
                teamId={userTeam.id}
                name={userTeam.name}
                logoText={userTeam.logoText}
                accentColor={userTeam.accentColor}
                size="lg"
                className="w-full h-full rounded-full"
              />
            </div>
            <span className="font-bold text-base sm:text-lg text-emerald-400 max-w-[140px] truncate">
              {userTeam.name}
            </span>
          </div>

          {/* Central Match Score */}
          <div className="flex flex-col items-center">
            <div className="text-5xl sm:text-6xl font-display font-black tracking-wider text-white">
              {userLiveScore} <span className="text-stone-500 font-normal">−</span> {oppLiveScore}
            </div>
            {/* Subtitle with Regulation or Overtime Target and side switch */}
            <span className="text-[11px] font-mono tracking-widest text-stone-400 mt-1 uppercase">
              {currentRoundEvent && currentRoundEvent.phase === 'overtime'
                ? `OVERTIME ${currentRoundEvent.overtimeBlock} · PRIMEIRO A ${16 + 3 * ((currentRoundEvent.overtimeBlock || 1) - 1)}`
                : 'MR12 · PRIMEIRO A 13'}
            </span>

            {/* Round outcome timeline dots */}
            <div className="flex items-center gap-1.5 mt-3 max-w-[260px] flex-wrap justify-center">
              {displayedRounds.map((rnd, i) => (
                <div
                  key={i}
                  title={`Round ${rnd.roundNumber}: ${rnd.winner === 'user' ? userTeam.name : opponentTeam.name}`}
                  className={`w-2.5 h-2.5 rounded-full ${
                    rnd.winner === 'user' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              ))}
              {!isMapFinished && (
                <div className="w-2.5 h-2.5 rounded-full border border-stone-400 animate-ping" />
              )}
            </div>
          </div>

          {/* Opponent Team */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-stone-600/80 p-1 flex items-center justify-center bg-stone-950 shadow-lg">
              <TeamLogo
                teamId={opponentTeam.id}
                name={opponentTeam.name}
                logoText={opponentTeam.logoText}
                accentColor={opponentTeam.accentColor}
                size="lg"
                className="w-full h-full rounded-full"
              />
            </div>
            <span className="font-bold text-base sm:text-lg text-stone-200 max-w-[140px] truncate">
              {opponentTeam.name}
            </span>
          </div>
        </div>

        {/* Both 5-Player Lineups side-by-side matching screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 border border-white/5 rounded-xl p-4 my-2">
          {/* User Lineup (Left) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold">
                {userTeam.name} (OVR {userTeam.ovr})
              </span>
              {currentRoundEvent && (
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                  currentRoundEvent.userSide === 'CT' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  LADO: {currentRoundEvent.userSide}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {userTeam.roster.slice(0, 5).map(player => {
                const badge = roleBadgeConfig[player.role] || { label: player.role.toUpperCase(), bg: 'bg-stone-700', text: 'text-white' };
                return (
                  <div key={player.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-3.5 rounded-xs overflow-hidden shrink-0 shadow-xs border border-white/10 flex items-center justify-center">
                        <CountryFlag countryCode={player.country} />
                      </div>
                      <span className="font-mono text-[10px] text-stone-400 font-semibold">{player.country}</span>
                      <span className="font-bold text-stone-200">{player.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono font-bold text-stone-300">{player.ovr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opponent Lineup (Right) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider uppercase text-rose-400 font-bold">
                {opponentTeam.name} (OVR {opponentTeam.ovr})
              </span>
              {currentRoundEvent && (
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                  currentRoundEvent.opponentSide === 'CT' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  LADO: {currentRoundEvent.opponentSide}
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
                const badge = roleBadgeConfig[player.role] || { label: player.role.toUpperCase(), bg: 'bg-stone-700', text: 'text-white' };
                return (
                  <div key={player.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-3.5 rounded-xs overflow-hidden shrink-0 shadow-xs border border-white/10 flex items-center justify-center">
                        <CountryFlag countryCode={player.country} />
                      </div>
                      <span className="font-mono text-[10px] text-stone-400 font-semibold">{player.country}</span>
                      <span className="font-bold text-stone-200">{player.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono font-bold text-stone-300">{player.ovr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-2">
          {/* Latest round highlight description */}
          <div className="text-xs font-mono text-stone-300 italic max-w-md truncate">
            {currentRoundEvent ? currentRoundEvent.highlightText : 'Aquecendo para o confronto...'}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!isMapFinished ? (
              <>
                <button
                  onClick={() => setIsPlayingAuto(prev => !prev)}
                  className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-mono font-semibold transition"
                >
                  {isPlayingAuto ? 'Pausar' : 'Continuar'}
                </button>
                <button
                  onClick={handleNextRound}
                  className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-xs font-mono font-semibold transition"
                >
                  Próximo round
                </button>
                <button
                  onClick={handleFastForward}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Simular Rápido
                </button>
              </>
            ) : (
              <button
                onClick={handleProceed}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSeriesDecided ? 'Concluir Partida' : 'Próximo Mapa da Série'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
