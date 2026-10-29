/* Hallmark · redesign: full · keep BO1/BO3 veto engine, CPU decision, red/green pick-ban cues · semantic tokens */
import React, { useState, useEffect } from 'react';
import { TournamentTeam, TournamentMatch, MapVetoState } from '../types/tournament';
import { TOURNAMENT_MAPS, computeCpuVetoChoice, transitionVetoState } from '../utils/tournamentEngine';
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
    if (vetoState.currentTurn === 'completed') return 'Mapa definido!';
    if (botThinking || vetoState.currentTurn === 'cpu_ban' || vetoState.currentTurn === 'cpu_pick') {
      return vetoState.currentTurn === 'cpu_ban' ? 'O bot está banindo...' : 'O bot está escolhendo...';
    }
    if (vetoState.currentTurn === 'user_ban') return 'Bana um mapa';
    if (vetoState.currentTurn === 'user_pick') return 'Escolha seu mapa';
    return '';
  };

  const isUserTurn = vetoState.currentTurn === 'user_ban' || vetoState.currentTurn === 'user_pick';
  const actionButtonLabel = vetoState.currentTurn === 'user_pick' ? 'Escolher' : 'Banir';
  // Current phase drives red (ban) vs green (pick) cues everywhere
  const isBanPhase = vetoState.currentTurn === 'user_ban' || vetoState.currentTurn === 'cpu_ban';
  const isPickPhase = vetoState.currentTurn === 'user_pick' || vetoState.currentTurn === 'cpu_pick';

  return (
    <div className="w-full bg-cs-surface border border-cs-border rounded-2xl p-5 text-white shadow-sm mb-4">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-cs-muted mb-4">
        <div>
          Pick / Ban · <span className="font-bold text-white">{format}</span> · Rodada {match.roundNumber}
        </div>
        <div className={`font-bold px-2.5 py-1 rounded-md border ${
          isBanPhase
            ? 'text-cs-red bg-cs-red/10 border-cs-red/40'
            : isPickPhase
            ? 'text-cs-green bg-cs-green/10 border-cs-green/40'
            : 'text-cs-accent border-transparent'
        }`}>
          {isBanPhase ? '✕ ' : isPickPhase ? '✓ ' : ''}{getStatusText()}
        </div>
      </div>

      {/* Matchup Header: User vs Opponent */}
      <div className="flex items-center justify-center gap-4 py-2 border-b border-cs-border mb-5">
        <div className="flex items-center gap-2">
          <TeamLogo
            teamId={userTeam.id}
            name={userTeam.name}
            logoText={userTeam.logoText}
            accentColor={userTeam.accentColor}
            size="sm"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-bold text-sm text-cs-green">
            {userTeam.name}
          </span>
        </div>

        <span className="text-xs font-semibold text-cs-muted">vs</span>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-cs-text">
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
              className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                isBanned
                  ? 'opacity-50 grayscale bg-cs-red/5 border-cs-red/30'
                  : isPicked
                  ? 'ring-2 ring-cs-green bg-cs-green/10 border-cs-green/40'
                  : isUserTurn && !botThinking && isBanPhase
                  ? 'bg-cs-card border-cs-border hover:border-cs-red hover:bg-cs-red/5'
                  : isUserTurn && !botThinking && isPickPhase
                  ? 'bg-cs-card border-cs-border hover:border-cs-green hover:bg-cs-green/5'
                  : 'bg-cs-card border-cs-border'
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
                  <span className={`text-sm font-bold ${isBanned ? 'line-through text-cs-muted' : 'text-white'}`}>
                    {mapMeta.name}
                  </span>
                  {actionStep && (
                    <div className="text-[11px] text-cs-muted">
                      {actionStep.type === 'ban' ? 'Banido por ' : 'Escolhido por '}
                      <span className="font-semibold text-cs-text">
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
                  <span className="text-[10px] font-mono font-semibold text-cs-green">
                    {userProf}%
                  </span>
                  <div className="w-full h-1.5 bg-cs-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cs-green transition-colors"
                      style={{ width: `${userProf}%` }}
                    />
                  </div>
                </div>

                {/* Opponent Bar (Red) */}
                <div className="flex flex-col items-start w-20">
                  <span className="text-[10px] font-mono font-semibold text-cs-red">
                    {oppProf}%
                  </span>
                  <div className="w-full h-1.5 bg-cs-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cs-red transition-colors"
                      style={{ width: `${oppProf}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                {isAvailable && (
                  <button
                    type="button"
                    disabled={!isUserTurn || botThinking}
                    onClick={() => handleUserAction(mapMeta.id, mapMeta.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:outline-none ${
                      !isUserTurn || botThinking
                        ? 'bg-cs-surface text-cs-muted'
                        : isPickPhase
                        ? 'bg-cs-green text-black hover:bg-emerald-400 focus-visible:ring-cs-green'
                        : 'bg-cs-red text-white hover:bg-red-400 focus-visible:ring-cs-red'
                    }`}
                  >
                    {isPickPhase ? '✓ ' : '✕ '}{actionButtonLabel}
                  </button>
                )}

                {isBanned && (
                  <span className="px-2.5 py-1 rounded bg-cs-red/20 text-cs-red border border-cs-red/40 text-xs font-bold">
                    Banido
                  </span>
                )}

                {isPicked && (
                  <span className="px-2.5 py-1 rounded bg-cs-green text-black text-xs font-bold">
                    Selecionado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info: e.g. 8 mapas · 1 restante pra jogar */}
      <div className="text-center text-xs text-cs-muted pt-2 border-t border-cs-border">
        {TOURNAMENT_MAPS.length} mapas · {availableMaps.length} restante{availableMaps.length !== 1 ? 's' : ''} para jogar
      </div>
    </div>
  );
};
