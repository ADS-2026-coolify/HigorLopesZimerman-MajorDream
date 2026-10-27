import React, { useState } from 'react';
import { Player } from '../types';
import { ACTIVE_MAPS } from '../data/csData';
import { PlayerAvatar } from './PlayerAvatar';
import { CountryFlag } from './CountryFlag';
import { TeamLogo } from './TeamLogo';
import { calculateSynergy } from '../utils/simulationEngine';
import { sound } from '../utils/sound';
import { RotateCcw, ArrowRight, Plus, Minus, MapPin, Check, AlertCircle } from 'lucide-react';

interface FinalResultsViewProps {
  teamName: string;
  lineup: Player[];
  teamOvr: number;
  onRestartDraft: () => void;
  onSimulateCampaign: (configuredTeamName: string, mapPoints: Record<string, number>) => void;
}

// Compact role badges configuration
const roleConfigs: Record<string, { label: string; full: string; bgColor: string }> = {
  igl: { label: 'IGL', full: 'In-Game Leader', bgColor: 'bg-[#1D4ED8]' },
  awp: { label: 'AWP', full: 'Sniper (AWPer)', bgColor: 'bg-[#7C3AED]' },
  entry: { label: 'ENT', full: 'Entry Fragger', bgColor: 'bg-[#DC2626]' },
  rifler: { label: 'RIF', full: 'Rifler', bgColor: 'bg-[#D97706]' },
  lurker: { label: 'LURK', full: 'Lurker', bgColor: 'bg-[#0D9488]' },
  support: { label: 'SUP', full: 'Support', bgColor: 'bg-[#4F46E5]' },
};

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  teamName: initialTeamName,
  lineup,
  teamOvr,
  onRestartDraft,
  onSimulateCampaign
}) => {
  // 1. Team Name state & editing
  const [customTeamName, setCustomTeamName] = useState<string>(initialTeamName || 'Meu Time');
  const [nameError, setNameError] = useState<string | null>(null);

  // 2. Map point allocation budget & state (10 total points)
  const TOTAL_POINTS = 10;
  const [points, setPoints] = useState<Record<string, number>>({
    mirage: 2,
    inferno: 2,
    nuke: 2,
    dust2: 2,
    ancient: 2,
    anubis: 0,
    overpass: 0,
  });

  const usedPoints = Object.values(points).reduce((a, b) => a + b, 0);
  const remainingPoints = TOTAL_POINTS - usedPoints;

  // 3. Confirm dialog state for Restart Draft
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Synergy calculation
  const synergy = calculateSynergy(lineup);

  const getOvrColor = (ovr: number) => {
    if (ovr >= 95) return 'text-amber-400';
    if (ovr >= 90) return 'text-purple-400';
    if (ovr >= 85) return 'text-sky-400';
    return 'text-emerald-400';
  };

  const handleAddPoint = (mapId: string) => {
    if (remainingPoints <= 0) return;
    sound.playClick();
    setPoints(prev => ({
      ...prev,
      [mapId]: (prev[mapId] || 0) + 1
    }));
  };

  const handleRemovePoint = (mapId: string) => {
    if ((points[mapId] || 0) <= 0) return;
    sound.playClick();
    setPoints(prev => ({
      ...prev,
      [mapId]: (prev[mapId] || 0) - 1
    }));
  };

  const handleResetPoints = () => {
    sound.playClick();
    setPoints({
      mirage: 0,
      inferno: 0,
      nuke: 0,
      dust2: 0,
      ancient: 0,
      anubis: 0,
      overpass: 0,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTeamName(val);
    if (!val.trim()) {
      setNameError('O nome da equipe não pode ficar vazio.');
    } else if (val.trim().length > 30) {
      setNameError('O nome deve ter no máximo 30 caracteres.');
    } else {
      setNameError(null);
    }
  };

  const handleStartCampaign = () => {
    const trimmed = customTeamName.trim();
    if (!trimmed) {
      setNameError('Por favor, informe um nome para a sua equipe.');
      return;
    }
    if (trimmed.length > 30) {
      setNameError('O nome deve ter no máximo 30 caracteres.');
      return;
    }
    if (remainingPoints > 0) {
      alert(`Distribua todos os ${TOTAL_POINTS} pontos de vantagem de mapa antes de simular a campanha. Restam ${remainingPoints} ponto(s).`);
      return;
    }
    sound.playClick();
    onSimulateCampaign(trimmed, points);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto w-full px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* TOP SECTION: 2 PANELS (LEFT: Summary & Config | RIGHT: Completed Roster)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* PANEL A: LEFT PANEL (Team Summary & Configuration - 5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-2xl border border-cs-border flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Completion indicator */}
            <div className="flex items-center justify-between border-b border-cs-border/60 pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Escalação Completa
              </span>
              <span className="text-xs text-slate-400 font-mono">5 / 5 Jogadores</span>
            </div>

            {/* Editable Team Name */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="team-name-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Nome da Equipe
              </label>
              <input
                id="team-name-input"
                type="text"
                value={customTeamName}
                maxLength={30}
                onChange={handleNameChange}
                placeholder="Ex: Made in Brazil, Luminosity..."
                className={`
                  w-full px-4 py-3 rounded-xl bg-[#090D16] border text-white font-display font-black text-xl tracking-wide placeholder-slate-600 focus:outline-none transition-all
                  ${nameError ? 'border-red-500 focus:ring-2 focus:ring-red-500/50' : 'border-cs-border focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'}
                `}
              />
              {nameError && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Prominent Team Overall Display */}
            <div className="rounded-2xl bg-gradient-to-br from-[#090D16] to-[#121B2D] border border-cs-border/80 p-6 text-center relative overflow-hidden shadow-inner">
              <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-widest block mb-1">
                Overall Geral do Time
              </span>
              <div className={`font-display font-black text-6xl md:text-7xl tracking-tight ${getOvrColor(teamOvr)}`}>
                {teamOvr}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-mono">
                Média dos ratings oficiais com cálculo de sinergia
              </p>
            </div>

            {/* Synergy & Composition Pill */}
            <div className="p-3.5 rounded-xl bg-cs-surface/80 border border-cs-border text-left flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  Sinergia de Funções
                </span>
                <span className="text-[11px] text-slate-400">
                  {synergy.type === 'full' 
                    ? 'Composição perfeita de papéis (+2 OVR aplicado)' 
                    : synergy.type === 'broken' 
                    ? 'Composição desbalanceada (penalidade)' 
                    : 'Composição padrão'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-black uppercase ${
                synergy.scoreBonus > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                synergy.scoreBonus < 0 ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                'bg-slate-700/50 text-slate-300 border border-slate-600'
              }`}>
                {synergy.scoreBonus >= 0 ? `+${synergy.scoreBonus}` : synergy.scoreBonus} OVR
              </span>
            </div>
          </div>

          {/* Primary Action Button (Simulate Campaign) */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleStartCampaign}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Avançar para o Major</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Secondary Action (Restart Draft with Confirmation) */}
            {!showRestartConfirm ? (
              <button
                onClick={() => setShowRestartConfirm(true)}
                className="w-full py-2.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white flex items-center justify-center gap-1.5 rounded-lg hover:bg-cs-surface/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Draft</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-700/50 text-center space-y-2">
                <span className="text-xs text-red-200 block font-mono">
                  Descartar este time e começar novo draft?
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRestartDraft();
                    }}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Sim, reiniciar
                  </button>
                  <button
                    onClick={() => setShowRestartConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL B: RIGHT PANEL (Completed Roster List - 7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-2xl border border-cs-border flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-cs-border/60 pb-3">
              <h3 className="font-display font-black text-lg text-white uppercase tracking-wider text-left">
                Quinteto Titular Revelado
              </h3>
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                Overall Revelado
              </span>
            </div>

            {/* Compact 5-player row list */}
            <div className="space-y-2.5">
              {lineup.map((player) => {
                const normalizedRole = player.role?.toLowerCase() || 'rifler';
                const roleConfig = roleConfigs[normalizedRole] || {
                  label: normalizedRole.slice(0, 3).toUpperCase(),
                  full: normalizedRole.toUpperCase(),
                  bgColor: 'bg-[#D97706]'
                };

                return (
                  <div
                    key={player.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-[#090D16]/90 border border-[#1E293B] hover:border-cs-border flex items-center justify-between gap-3 transition-colors select-none"
                  >
                    {/* Player Avatar */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-12 rounded-lg overflow-hidden bg-[#1E293B] shrink-0 border border-slate-700">
                        <PlayerAvatar
                          playerId={player.id}
                          nickname={player.nickname}
                          className="w-full h-full object-cover object-top"
                          size="sm"
                        />
                      </div>

                      {/* Info: Nickname & Team/Era */}
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-black text-base text-white truncate">
                            {player.nickname}
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {player.teamName} · {player.era}
                        </span>
                      </div>
                    </div>

                    {/* Meta: Flag, Role badge & OVR score */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {/* Nationality Flag */}
                      <div className="w-7 h-5 rounded overflow-hidden shadow-inner shrink-0 hidden sm:block" title={player.countryName || player.country}>
                        <CountryFlag countryCode={player.country} />
                      </div>

                      {/* Team Logo */}
                      <div className="w-7 h-7 rounded bg-[#090D16] border border-[#1E293B] flex items-center justify-center p-0.5 shrink-0" title={player.teamName}>
                        <TeamLogo
                          teamId={player.teamId}
                          name={player.teamName}
                          logoText={player.teamName.slice(0, 3).toUpperCase()}
                          accentColor="#38BDF8"
                          size="sm"
                          className="w-full h-full border-0 shadow-none bg-transparent"
                        />
                      </div>

                      {/* Role Pill */}
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-black text-white ${roleConfig.bgColor}`}
                        title={roleConfig.full}
                      >
                        {roleConfig.label}
                      </span>

                      {/* Player OVR score */}
                      <div className="w-12 text-right">
                        <span className={`font-display font-black text-xl leading-none ${getOvrColor(player.ovr)}`}>
                          {player.ovr}
                        </span>
                        <span className="text-[9px] uppercase font-mono text-slate-500 block leading-tight">OVR</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-left text-xs text-slate-500 font-mono border-t border-cs-border/60 pt-3">
            Dica: No Counter-Strike Major, a sinergia e os overalls dos seus jogadores influenciam o combate em cada rodada da simulação MR12.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: MAP POINT DISTRIBUTION (Spans full available width)       */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-cs-border space-y-6 text-left">
        {/* Section Header & Budget Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cs-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                Vantagem de Mapa
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Distribua seus pontos entre os mapas para obter vantagem tática nos confrontos da fase suíça e playoffs do Major.
            </p>
          </div>

          {/* Budget Counters & Reset */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleResetPoints}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-cs-border hover:bg-cs-surface font-mono transition-colors"
            >
              Zerar Pontos
            </button>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#090D16] border border-cs-border">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Pontos Restantes:
              </span>
              <span className={`font-display font-black text-2xl ${remainingPoints === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {remainingPoints} / {TOTAL_POINTS}
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Grid of Map Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {ACTIVE_MAPS.map((map) => {
            const count = points[map.id] || 0;
            // Progress percentage for 0 to 5 points
            const progressPct = Math.min(100, (count / 5) * 100);

            return (
              <div
                key={map.id}
                className={`
                  relative rounded-xl border overflow-hidden transition-all duration-200 flex flex-col justify-between
                  ${count > 0 ? 'border-amber-400/80 bg-[#0E1524] shadow-lg shadow-amber-500/5' : 'border-[#1E293B] bg-[#090D16]/80'}
                `}
              >
                {/* Landscape Thumbnail with fallback banner */}
                <div className="relative h-24 w-full bg-[#121B2D] overflow-hidden">
                  <img
                    src={map.imageBg}
                    alt={map.name}
                    className="w-full h-full object-cover object-center brightness-75 hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1524] via-transparent to-black/30 pointer-events-none" />

                  {/* Active Duty status badge */}
                  <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-xs">
                    {map.activeDuty ? 'Active Duty' : 'Reserva'}
                  </span>

                  {/* Points tag overlay */}
                  {count > 0 && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-black">
                      +{count * 1.5} OVR
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-black text-sm text-white truncate">
                      de_{map.name.toLowerCase()}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {count} ponto{count !== 1 ? 's' : ''} alocado{count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${count > 0 ? 'bg-amber-400' : 'bg-transparent'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Plus / Minus Control Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={count <= 0}
                      onClick={() => handleRemovePoint(map.id)}
                      className="w-8 h-8 rounded-lg bg-[#1E293B] hover:bg-[#2A374F] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Diminuir ponto"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className={`font-display font-black text-base ${count > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {count}
                    </span>

                    <button
                      type="button"
                      disabled={remainingPoints <= 0}
                      onClick={() => handleAddPoint(map.id)}
                      className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Aumentar ponto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
