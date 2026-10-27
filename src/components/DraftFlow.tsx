import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Player, HistoricalTeam } from '../types';
import { HISTORICAL_TEAMS } from '../data/csData';
import { PlayerCard } from './PlayerCard';
import { TeamLogo } from './TeamLogo';
import { TeamRoulette } from './TeamRoulette';
import { FinalResultsView } from './FinalResultsView';
import { calculateTeamOvr } from '../utils/simulationEngine';
import { sound } from '../utils/sound';
import { RotateCcw, RefreshCw } from 'lucide-react';

interface DraftFlowProps {
  onCompleteDraft: (lineup: Player[], teamName: string, mapPoints: Record<string, number>) => void;
  onCancel: () => void;
}

// Key required roles matching the exact reference screenshot
const REQUIRED_ROLES = [
  { key: 'awp', label: 'AWPER', activeBg: 'bg-[#7C3AED]', activeGlow: 'shadow-[0_0_12px_rgba(124,58,237,0.7)]' },
  { key: 'rifler', label: 'RIFLER', activeBg: 'bg-[#D97706]', activeGlow: 'shadow-[0_0_12px_rgba(217,119,6,0.7)]' },
  { key: 'entry', label: 'ENTRY', activeBg: 'bg-[#DC2626]', activeGlow: 'shadow-[0_0_12px_rgba(220,38,38,0.7)]' },
  { key: 'igl', label: 'IGL', activeBg: 'bg-[#1D4ED8]', activeGlow: 'shadow-[0_0_12px_rgba(29,78,216,0.7)]' },
  { key: 'lurker', label: 'LURKER', activeBg: 'bg-[#0D9488]', activeGlow: 'shadow-[0_0_12px_rgba(13,148,136,0.7)]' },
];

export const DraftFlow: React.FC<DraftFlowProps> = ({ onCompleteDraft }) => {
  const { t } = useI18n();

  // Draft stages: 'roulette' -> 'selection' -> 'reveal_results'
  const [draftStage, setDraftStage] = useState<'roulette' | 'selection' | 'reveal_results'>('roulette');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [currentDrawnTeam, setCurrentDrawnTeam] = useState<HistoricalTeam | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [rerollsLeft, setRerollsLeft] = useState<number>(2); // 2 chances de re-roll
  const [teamName] = useState<string>('Meu Time');

  // Pool of available teams for drafting (excludes teams whose players have already been drafted to prevent duplicates)
  const availableTeams = HISTORICAL_TEAMS.filter(team => {
    const unpickedCount = team.roster.filter(p => !selectedPlayers.some(sp => sp.nickname.toLowerCase() === p.nickname.toLowerCase())).length;
    return unpickedCount > 0;
  });

  // Handle roulette finishing with a chosen team
  const handleTeamDrawn = (team: HistoricalTeam) => {
    setCurrentDrawnTeam(team);
    setDraftStage('selection');
  };

  // Select a player from current drawn team - clicking card directly selects and triggers next roulette
  const handleSelectPlayer = (player: Player) => {
    sound.playCardReveal();
    const updated = [...selectedPlayers, player];
    setSelectedPlayers(updated);

    if (updated.length < 5) {
      // Automatically advance to the next roulette draw
      setCurrentDrawnTeam(null);
      setIsDrawing(false);
      setDraftStage('roulette');
    } else {
      // 5 players drafted: move to separate Final Results screen where ratings are revealed
      setDraftStage('reveal_results');
    }
  };

  // Re-roll current drawn team to spin again
  const handleReroll = () => {
    if (rerollsLeft <= 0 || isDrawing) return;
    sound.playClick();
    setRerollsLeft(prev => prev - 1);
    setCurrentDrawnTeam(null);
    setIsDrawing(false);
    setDraftStage('roulette');
  };

  // Restart the draft completely
  const handleRestart = () => {
    sound.playClick();
    setSelectedPlayers([]);
    setCurrentDrawnTeam(null);
    setIsDrawing(false);
    setRerollsLeft(2);
    setDraftStage('roulette');
  };

  const finalTeamOvr = calculateTeamOvr(selectedPlayers);

  // Check which positions have been filled in the current lineup
  const filledRolesMap: Record<string, boolean> = {};
  selectedPlayers.forEach(p => {
    const roleKey = p.role.toLowerCase();
    filledRolesMap[roleKey] = true;
  });

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* 1. SEPARATE FINAL RESULTS SCREEN (OVR REVEALED ONLY HERE) */}
      {draftStage === 'reveal_results' && (
        <FinalResultsView
          teamName={teamName || 'Meu Time'}
          lineup={selectedPlayers}
          teamOvr={finalTeamOvr}
          onRestartDraft={handleRestart}
          onSimulateCampaign={(configuredName, mapPoints) => {
            onCompleteDraft(selectedPlayers, configuredName, mapPoints);
          }}
        />
      )}

      {/* 2. ACTIVE DRAFT FLOW (ROULETTE & SELECTION) */}
      {draftStage !== 'reveal_results' && (
        <>
          {/* Header Progress & Status Bar */}
          <div className="glass-panel p-6 rounded-2xl border border-cs-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                Draft do Elenco · Vaga {Math.min(5, selectedPlayers.length + 1)} de 5
              </div>
              <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-wide uppercase">
                {draftStage === 'roulette' ? 'Sorteio de Equipe' : 'Escolha um Jogador'}
              </h2>
            </div>

            {/* Selected Roster Progress Indicator */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map(idx => {
                const filled = selectedPlayers[idx];
                return (
                  <div
                    key={idx}
                    className={`h-2.5 w-8 rounded-full transition-all ${
                      filled ? 'bg-amber-400' : 'bg-cs-surface border border-cs-border'
                    }`}
                    title={`Vaga ${idx + 1}`}
                  />
                );
              })}
            </div>

            <button
              onClick={handleRestart}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cs-border hover:bg-cs-surface transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('draft.resetDraft')}</span>
            </button>
          </div>

          {/* Current Lineup Mini Slots (Strictly hiding ratings) */}
          <div className="space-y-3">
            {/* Header: Clean ESCALAÇÃO & Role Pills */}
            <div className="flex items-center gap-3 bg-cs-surface/40 px-4 py-3 rounded-2xl border border-cs-border/60">
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-slate-300 select-none">
                ESCALAÇÃO
              </span>

              {/* Role Status Badges (Colored with glow when present, muted dashed when missing) */}
              <div className="flex flex-wrap items-center gap-2">
                {REQUIRED_ROLES.map(role => {
                  const isFilled = !!filledRolesMap[role.key];
                  return (
                    <span
                      key={role.key}
                      className={`
                        px-3 py-1 rounded-md text-[11px] font-mono font-black uppercase transition-all duration-300 select-none
                        ${isFilled
                          ? `${role.activeBg} text-white ${role.activeGlow}`
                          : 'bg-[#1E293B]/70 text-slate-400/80 border border-dashed border-slate-600/70'}
                      `}
                      title={isFilled ? `${role.label}: Já escalado` : `${role.label}: Falta escalar`}
                    >
                      {role.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 5 Slots Grid (Uniform cards and slots matching the exact player cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
              {[0, 1, 2, 3, 4].map(idx => {
                const player = selectedPlayers[idx];
                if (player) {
                  return (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      showOvr={false} // NEVER SHOW OVR DURING DRAFT
                      size="md"
                    />
                  );
                }
                return (
                  <div
                    key={`slot_${idx}`}
                    className="w-full max-w-[220px] p-4 rounded-[24px] bg-[#0E1524]/70 border-2 border-dashed border-[#1E293B] shadow-xl flex flex-col items-center justify-between text-center select-none"
                  >
                    {/* Top placeholder frame matching exact player avatar box */}
                    <div className="w-full flex justify-center pt-1 pb-3">
                      <div className="w-36 h-44 rounded-[20px] bg-[#1E293B]/40 border border-dashed border-[#334155]/60 flex flex-col items-center justify-center text-slate-500 gap-1">
                        <span className="font-display font-black text-sm uppercase tracking-wider text-slate-400">
                          Vaga {idx + 1}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Vaga vazia
                        </span>
                      </div>
                    </div>

                    {/* Middle title matching player nickname */}
                    <div className="w-full text-center pb-3">
                      <h3 className="font-display font-black text-lg text-slate-500 tracking-wide uppercase">
                        Aguardando
                      </h3>
                    </div>

                    {/* Bottom 3 placeholder slots matching exact 3-box footer */}
                    <div className="w-full grid grid-cols-3 gap-2 items-center opacity-40">
                      <div className="h-12 rounded-xl bg-[#090D16] border border-[#1E293B] flex items-center justify-center">
                        <span className="text-xs text-slate-600 font-mono">-</span>
                      </div>
                      <div className="h-12 rounded-xl bg-[#090D16] border border-[#1E293B] flex items-center justify-center">
                        <span className="text-xs text-slate-600 font-mono">-</span>
                      </div>
                      <div className="h-12 rounded-xl bg-[#090D16] border border-[#1E293B] flex items-center justify-center">
                        <span className="text-xs text-slate-600 font-mono">-</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1: TEAM ROULETTE (Auto-spins on mount/step change) */}
          {draftStage === 'roulette' && (
            <div className="py-6">
              <TeamRoulette
                teams={availableTeams}
                onTeamSelected={handleTeamDrawn}
                isDrawing={isDrawing}
                setIsDrawing={setIsDrawing}
              />
            </div>
          )}

          {/* STEP 2: PLAYER SELECTION SCREEN (Selected team roster) */}
          {draftStage === 'selection' && currentDrawnTeam && (
            <div className="glass-panel p-6 rounded-2xl border border-cs-border space-y-6">
              {/* Selected Team Banner with Re-Roll Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cs-border">
                <div className="flex items-center gap-4">
                  <TeamLogo
                    teamId={currentDrawnTeam.id}
                    name={currentDrawnTeam.name}
                    logoText={currentDrawnTeam.logoText}
                    accentColor={currentDrawnTeam.accentColor}
                    size="lg"
                  />
                  <div>
                    <span className="text-xs font-mono text-cs-muted">
                      Equipe Sorteada
                    </span>
                    <h3 className="font-display font-black text-2xl text-white">
                      {currentDrawnTeam.name} ({currentDrawnTeam.year})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentDrawnTeam.description}
                    </p>
                  </div>
                </div>

                {/* Re-Roll Button & Help Hint */}
                <div className="flex items-center gap-3">
                  <button
                    disabled={rerollsLeft <= 0}
                    onClick={handleReroll}
                    className={`
                      px-4 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all select-none
                      ${rerollsLeft > 0 
                        ? 'bg-[#1E293B] hover:bg-[#2A374F] text-amber-400 border border-amber-500/40 shadow-md hover:scale-105 active:scale-95 cursor-pointer' 
                        : 'opacity-40 cursor-not-allowed bg-cs-surface text-slate-500 border border-cs-border'}
                    `}
                    title={rerollsLeft > 0 ? `Sortear outra equipe (${rerollsLeft} restante${rerollsLeft > 1 ? 's' : ''})` : 'Sem re-rolls restantes'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Roll ({rerollsLeft})</span>
                  </button>
                </div>
              </div>

              {/* Selectable Roster Cards: DIRECT CLICK ON CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
                {currentDrawnTeam.roster.map(player => {
                  const isAlreadyPicked = selectedPlayers.some(
                    sp => sp.nickname.toLowerCase() === player.nickname.toLowerCase()
                  );

                  return (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      isSelected={isAlreadyPicked}
                      showOvr={false} // STRICT REQUIREMENT: HIDE OVR
                      onSelect={() => handleSelectPlayer(player)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
