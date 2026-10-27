import React, { useState, useEffect } from 'react';
import { TournamentTeam, TournamentMatch, MapVetoState } from '../types/tournament';
import { TOURNAMENT_MAPS, computeCpuVetoChoice, transitionVetoState, getExpectedVetoStep } from '../utils/tournamentEngine';
import { TeamLogo } from './TeamLogo';
import { sound } from '../utils/sound';

interface MapVetoViewProps {
  match: TournamentMatch;
  userTeam: TournamentTeam;
  opponentTeam: TournamentTeam;
  onVetoComplete: (pickedMaps: string[]) => void;
}

export const MapVetoView: React.FC<MapVetoViewProps> = ({
  match,
  userTeam,
  opponentTeam,
  onVetoComplete
}) => {
  const format = match.format; // 'BO1' or 'BO3'

  // Initialize or resume veto state
  const [vetoState, setVetoState] = useState<MapVetoState>(() => {
    return {
      currentTurn: 'user_ban',
      bannedMaps: [],
      pickedMaps: [],
      history: [],
      format
    };
  });

  const [botThinking, setBotThinking] = useState(false);

  // Available maps: not yet banned and not yet picked
  const availableMaps = TOURNAMENT_MAPS.filter(
    m => !vetoState.bannedMaps.includes(m.id) && !vetoState.pickedMaps.includes(m.id)
  );

  // Handle CPU Turn automated trigger with natural delay
  useEffect(() => {
    if (vetoState.currentTurn === 'completed') return;

    if (vetoState.currentTurn === 'cpu_ban' || vetoState.currentTurn === 'cpu_pick') {
      setBotThinking(true);
      const timer = setTimeout(() => {
        executeCpuAction();
        setBotThinking(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [vetoState.currentTurn]);

  // Execute CPU decision
  const executeCpuAction = () => {
    const isBan = vetoState.currentTurn === 'cpu_ban';
    const actionType = isBan ? 'ban' : 'pick';

    const chosenMapId = computeCpuVetoChoice(
      actionType,
      availableMaps.map(m => m.id),
      opponentTeam.mapProficiencies || {},
      userTeam.mapProficiencies || {}
    );

    const mapMeta = TOURNAMENT_MAPS.find(m => m.id === chosenMapId)!;
    applyVetoChoice(chosenMapId, mapMeta?.name || chosenMapId);
  };

  // User action handler
  const handleUserAction = (mapId: string, mapName: string) => {
    if (botThinking) return;
    if (vetoState.currentTurn !== 'user_ban' && vetoState.currentTurn !== 'user_pick') return;

    sound.playClick();
    applyVetoChoice(mapId, mapName);
  };

  // Apply state transitions using pure tournament engine
  const applyVetoChoice = (
    mapId: string,
    mapName: string
  ) => {
    const nextState = transitionVetoState(vetoState, mapId, mapName, TOURNAMENT_MAPS);
    setVetoState(nextState);

    if (nextState.currentTurn === 'completed') {
      sound.playRoundWin();
      setTimeout(() => {
        onVetoComplete(nextState.pickedMaps);
      }, 1000);
    }
  };

  // Top status text
  const getStatusText = () => {
    if (vetoState.currentTurn === 'completed') return 'MAPA DEFINIDO!';
    if (botThinking || vetoState.currentTurn === 'cpu_ban' || vetoState.currentTurn === 'cpu_pick') {
      return vetoState.currentTurn === 'cpu_ban' ? 'O BOT ESTÁ BANINDO...' : 'O BOT ESTÁ ESCOLHENDO...';
    }
    if (vetoState.currentTurn === 'user_ban') return 'BANA UM MAPA';
    if (vetoState.currentTurn === 'user_pick') return 'ESCOLHA SEU MAPA';
    return '';
  };

  const isUserTurn = vetoState.currentTurn === 'user_ban' || vetoState.currentTurn === 'user_pick';
  const actionButtonLabel = vetoState.currentTurn === 'user_pick' ? 'ESCOLHER' : 'BANIR';

  return (
    <div className="w-full bg-[#f4efe6] dark:bg-[#18181b] border border-stone-300/80 dark:border-stone-800 rounded-2xl p-5 text-stone-900 dark:text-stone-100 shadow-sm transition-all mb-4">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider uppercase text-stone-500 mb-4">
        <div>
          PICK / BAN · <span className="font-bold text-stone-800 dark:text-stone-200">{format}</span> · ROUND {match.roundNumber}
        </div>
        <div className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">
          {getStatusText()}
        </div>
      </div>

      {/* Matchup Header: User vs Opponent */}
      <div className="flex items-center justify-center gap-4 py-2 border-b border-stone-300/60 dark:border-stone-800/80 mb-5">
        <div className="flex items-center gap-2">
          <TeamLogo
            teamId={userTeam.id}
            name={userTeam.name}
            logoText={userTeam.logoText}
            accentColor={userTeam.accentColor}
            size="sm"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
            {userTeam.name}
          </span>
        </div>

        <span className="text-xs font-mono text-stone-400">VS</span>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-stone-800 dark:text-stone-200">
            {opponentTeam.name}
          </span>
          <TeamLogo
            teamId={opponentTeam.id}
            name={opponentTeam.name}
            logoText={opponentTeam.logoText}
            accentColor={opponentTeam.accentColor}
            size="sm"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>

      {/* Grid of Maps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {TOURNAMENT_MAPS.map(mapMeta => {
          const isBanned = vetoState.bannedMaps.includes(mapMeta.id);
          const isPicked = vetoState.pickedMaps.includes(mapMeta.id);
          const isAvailable = !isBanned && !isPicked;

          const userProf = userTeam.mapProficiencies?.[mapMeta.id] ?? 50;
          const oppProf = opponentTeam.mapProficiencies?.[mapMeta.id] ?? 50;

          // Find who banned/picked this map
          const actionStep = vetoState.history.find(h => h.mapId === mapMeta.id);

          return (
            <div
              key={mapMeta.id}
              className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isBanned
                  ? 'opacity-40 grayscale bg-stone-200/40 dark:bg-stone-900/40 border-stone-300 dark:border-stone-800'
                  : isPicked
                  ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-white/80 dark:bg-stone-900/80 border-stone-300/80 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {/* Map Info & Image */}
              <div className="flex items-center gap-3">
                <img
                  src={mapMeta.thumbnail}
                  alt={mapMeta.name}
                  className="w-12 h-10 object-cover rounded-lg shadow-sm shrink-0"
                />
                <div>
                  <span className={`text-sm font-bold ${isBanned ? 'line-through text-stone-400' : ''}`}>
                    {mapMeta.name}
                  </span>
                  {actionStep && (
                    <div className="text-[10px] font-mono text-stone-500">
                      {actionStep.type === 'ban' ? 'Banido por ' : 'Escolhido por '}
                      <span className="font-semibold">
                        {actionStep.actor === 'user' ? 'Você' : 'Bot'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Proficiency Comparison Bars */}
              <div className="flex items-center gap-3 shrink-0">
                {/* User Bar (Green) */}
                <div className="flex flex-col items-end w-20">
                  <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {userProf}%
                  </span>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${userProf}%` }}
                    />
                  </div>
                </div>

                {/* Opponent Bar (Red) */}
                <div className="flex flex-col items-start w-20">
                  <span className="text-[10px] font-mono font-semibold text-rose-500">
                    {oppProf}%
                  </span>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${oppProf}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                {isAvailable && (
                  <button
                    disabled={!isUserTurn || botThinking}
                    onClick={() => handleUserAction(mapMeta.id, mapMeta.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 ${
                      isUserTurn && !botThinking
                        ? 'bg-stone-900 text-stone-100 hover:bg-black dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow'
                        : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {actionButtonLabel}
                  </button>
                )}

                {isPicked && (
                  <span className="px-2.5 py-1 rounded bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase">
                    SELECIONADO
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info: e.g. 8 MAPAS · 1 RESTANTE PRA JOGAR */}
      <div className="text-center text-[11px] font-mono tracking-wider text-stone-500 pt-2 border-t border-stone-300/40 dark:border-stone-800/40">
        {TOURNAMENT_MAPS.length} MAPAS · {availableMaps.length} RESTANTE{availableMaps.length !== 1 ? 'S' : ''} PRA JOGAR
      </div>
    </div>
  );
};
