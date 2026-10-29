/* Hallmark · redesign: full · keep draft stages, roulette, reroll, player selection · semantic tokens */
import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Player, HistoricalTeam } from '../types';
import { HISTORICAL_TEAMS } from '../data/csData';
import { PlayerCard } from './PlayerCard';
import { TeamLogo } from './TeamLogo';
import { TeamRoulette } from './TeamRoulette';
import { FinalResultsView } from './FinalResultsView';
import { calculateTeamOvr } from '../utils/simulationEngine';
import { resetDraftMapSession } from '../utils/mapProficiency';
import { sound } from '../utils/sound';
import { RotateCcw, RefreshCw } from 'lucide-react';

interface DraftFlowProps {
  onCompleteDraft: (lineup: Player[], teamName: string, mapPoints: Record<string, number>, baseProficiencies?: Record<string, number>) => void;
  onCancel: () => void;
}

const REQUIRED_ROLES = [
  { key: 'awp', label: 'AWP', activeBg: 'bg-violet-700' },
  { key: 'rifler', label: 'RIF', activeBg: 'bg-amber-700' },
  { key: 'entry', label: 'ENT', activeBg: 'bg-red-700' },
  { key: 'igl', label: 'IGL', activeBg: 'bg-blue-700' },
  { key: 'lurker', label: 'LURK', activeBg: 'bg-teal-700' },
  { key: 'support', label: 'SUP', activeBg: 'bg-indigo-700' },
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

  // Pool of available teams for drafting
  const availableTeams = HISTORICAL_TEAMS.filter(team => {
    const unpickedCount = team.roster.filter(p => !selectedPlayers.some(sp => sp.nickname.toLowerCase() === p.nickname.toLowerCase())).length;
    return unpickedCount > 0;
  });

  const handleTeamDrawn = (team: HistoricalTeam) => {
    setCurrentDrawnTeam(team);
    setDraftStage('selection');
  };

  const handleSelectPlayer = (player: Player) => {
    sound.playCardReveal();
    const updated = [...selectedPlayers, player];
    setSelectedPlayers(updated);

    if (updated.length < 5) {
      setCurrentDrawnTeam(null);
      setIsDrawing(false);
      setDraftStage('roulette');
    } else {
      setDraftStage('reveal_results');
    }
  };

  const handleReroll = () => {
    if (rerollsLeft <= 0 || isDrawing) return;
    sound.playClick();
    setRerollsLeft(prev => prev - 1);
    setCurrentDrawnTeam(null);
    setIsDrawing(false);
    setDraftStage('roulette');
  };

  const handleRestart = () => {
    sound.playClick();
    resetDraftMapSession();
    setSelectedPlayers([]);
    setCurrentDrawnTeam(null);
    setIsDrawing(false);
    setRerollsLeft(2);
    setDraftStage('roulette');
  };

  const finalTeamOvr = calculateTeamOvr(selectedPlayers);

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
          onSimulateCampaign={(configuredName, mapPoints, baseProficiencies) => {
            onCompleteDraft(selectedPlayers, configuredName, mapPoints, baseProficiencies);
          }}
        />
      )}

      {/* 2. ACTIVE DRAFT FLOW (ROULETTE & SELECTION) */}
      {draftStage !== 'reveal_results' && (
        <>
          {/* Header Progress & Status Bar */}
          <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-black text-2xl md:text-3xl text-white">
                {draftStage === 'roulette' ? 'Sorteio de Equipe' : 'Escolha um Jogador'}
              </h2>
              <div className="text-xs font-semibold text-cs-accent mt-1">
                Draft do elenco: vaga {Math.min(5, selectedPlayers.length + 1)} de 5
              </div>
            </div>

            {/* Selected Roster Progress Indicator */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map(idx => {
                const filled = selectedPlayers[idx];
                return (
                  <div
                    key={idx}
                    className={`h-2.5 w-8 rounded-full transition-colors ${
                      filled ? 'bg-cs-accent' : 'bg-cs-card border border-cs-border'
                    }`}
                    title={`Vaga ${idx + 1}`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleRestart}
              className="text-xs text-cs-muted hover:text-white active:brightness-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cs-border bg-cs-card hover:bg-cs-hover transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('draft.resetDraft')}</span>
            </button>
          </div>

          {/* Current Lineup Mini Slots (Strictly hiding ratings) */}
          <div className="space-y-3">
            {/* Header: Clean Escalação & Role Pills */}
            <div className="flex items-center gap-3 bg-cs-surface px-4 py-3 rounded-2xl border border-cs-border">
              <span className="text-xs font-semibold text-cs-muted select-none">
                Escalação
              </span>

              {/* Role Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {REQUIRED_ROLES.map(role => {
                  const isFilled = !!filledRolesMap[role.key];
                  return (
                    <span
                      key={role.key}
                      className={`
                        px-3 py-1 rounded-md text-xs font-bold transition-colors select-none
                        ${isFilled
                          ? `${role.activeBg} text-white`
                          : 'bg-cs-card text-cs-muted border border-dashed border-cs-border'}
                      `}
                      title={isFilled ? `${role.label}: Já escalado` : `${role.label}: Falta escalar`}
                    >
                      {role.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 5 Slots Grid */}
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
                    className="w-full max-w-[220px] p-4 rounded-2xl bg-cs-card border-2 border-dashed border-cs-border flex flex-col items-center justify-between text-center select-none"
                  >
                    {/* Top placeholder frame */}
                    <div className="w-full flex justify-center pt-1 pb-3">
                      <div className="w-36 h-44 rounded-xl bg-cs-surface border border-dashed border-cs-border flex flex-col items-center justify-center text-cs-muted gap-1">
                        <span className="font-display font-bold text-sm text-cs-text">
                          Vaga {idx + 1}
                        </span>
                        <span className="text-xs text-cs-muted">
                          Vaga vazia
                        </span>
                      </div>
                    </div>

                    {/* Middle title */}
                    <div className="w-full text-center pb-3">
                      <h3 className="font-display font-bold text-base text-cs-muted">
                        Aguardando
                      </h3>
                    </div>

                    {/* Bottom 3 placeholder slots */}
                    <div className="w-full grid grid-cols-3 gap-2 items-center opacity-40">
                      <div className="h-12 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center">
                        <span className="text-xs text-cs-muted font-mono">-</span>
                      </div>
                      <div className="h-12 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center">
                        <span className="text-xs text-cs-muted font-mono">-</span>
                      </div>
                      <div className="h-12 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center">
                        <span className="text-xs text-cs-muted font-mono">-</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1: TEAM ROULETTE */}
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

          {/* STEP 2: PLAYER SELECTION SCREEN */}
          {draftStage === 'selection' && currentDrawnTeam && (
            <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border space-y-6">
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
                    <span className="text-xs font-semibold text-cs-muted">
                      Equipe sorteada
                    </span>
                    <h3 className="font-display font-black text-2xl text-white">
                      {currentDrawnTeam.name} ({currentDrawnTeam.year})
                    </h3>
                    <p className="text-xs text-cs-muted mt-0.5">
                      {currentDrawnTeam.description}
                    </p>
                  </div>
                </div>

                {/* Re-Roll Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={rerollsLeft <= 0}
                    onClick={handleReroll}
                    className={`
                      px-4 py-2.5 rounded-xl font-display font-bold text-xs flex items-center gap-2 transition-colors select-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none
                      ${rerollsLeft > 0 
                        ? 'bg-cs-card hover:bg-cs-hover text-cs-accent border border-cs-accent/40 cursor-pointer' 
                        : 'bg-cs-card text-cs-muted border border-cs-border'}
                    `}
                    title={rerollsLeft > 0 ? `Sortear outra equipe (${rerollsLeft} restante${rerollsLeft > 1 ? 's' : ''})` : 'Sem re-rolls restantes'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-roll ({rerollsLeft})</span>
                  </button>
                </div>
              </div>

              {/* Selectable Roster Cards */}
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
