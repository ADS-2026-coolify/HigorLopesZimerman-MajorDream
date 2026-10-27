import React from 'react';
import { Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { TeamLogo } from './TeamLogo';
import { CountryFlag } from './CountryFlag';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  onSelect?: () => void;
  showOvr?: boolean; // STRICT RULE: false during player selection, true ONLY in final results
  size?: 'sm' | 'md' | 'lg';
}

interface RoleConfig {
  label: string;       // Sigla curta de 3 a 4 letras max (ex: IGL, AWP, ENT, RIF, LURK, SUP)
  full: string;        // Tooltip com o nome completo
  bgColor: string;     // Cor do fundo do bloco
  shadowColor: string; // Sombra temática
}

// Siglas curtas para nunca cortar nas telas:
// 1. IGL    -> 3 letras
// 2. AWP    -> 3 letras
// 3. ENT    -> 3 letras
// 4. RIF    -> 3 letras
// 5. LURK   -> 4 letras
// 6. SUP    -> 3 letras
const roleConfigs: Record<string, RoleConfig> = {
  igl: {
    label: 'IGL',
    full: 'In-Game Leader',
    bgColor: 'bg-[#1D4ED8]',
    shadowColor: 'shadow-[#1D4ED8]/30'
  },
  awp: {
    label: 'AWP',
    full: 'Sniper (AWPer)',
    bgColor: 'bg-[#7C3AED]',
    shadowColor: 'shadow-[#7C3AED]/30'
  },
  entry: {
    label: 'ENT',
    full: 'Entry Fragger',
    bgColor: 'bg-[#DC2626]',
    shadowColor: 'shadow-[#DC2626]/30'
  },
  rifler: {
    label: 'RIF',
    full: 'Rifler',
    bgColor: 'bg-[#D97706]',
    shadowColor: 'shadow-[#D97706]/30'
  },
  lurker: {
    label: 'LURK',
    full: 'Lurker',
    bgColor: 'bg-[#0D9488]',
    shadowColor: 'shadow-[#0D9488]/30'
  },
  support: {
    label: 'SUP',
    full: 'Support',
    bgColor: 'bg-[#4F46E5]',
    shadowColor: 'shadow-[#4F46E5]/30'
  },
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected = false,
  onSelect,
  showOvr = false, // defaults to hidden
  size = 'md'
}) => {
  const isClickable = !!onSelect && !isSelected;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect();
    }
  };

  const getOvrColor = (ovr: number) => {
    if (ovr >= 95) return 'text-amber-400';
    if (ovr >= 90) return 'text-purple-400';
    if (ovr >= 85) return 'text-sky-400';
    return 'text-emerald-400';
  };

  const normalizedRole = player.role?.toLowerCase() || 'rifler';
  const roleConfig = roleConfigs[normalizedRole] || {
    label: normalizedRole.slice(0, 3).toUpperCase(),
    full: normalizedRole.toUpperCase(),
    bgColor: 'bg-[#D97706]',
    shadowColor: 'shadow-[#D97706]/30'
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onSelect : undefined}
      onKeyDown={handleKeyDown}
      className={`
        relative group transition-all duration-200 select-none
        rounded-[24px] bg-[#0E1524] border border-[#1E293B] shadow-xl
        flex flex-col items-center justify-between
        ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:border-[#38BDF8]/60 hover:shadow-2xl hover:shadow-[#0284C7]/20 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]' : ''}
        ${isSelected ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''}
        ${size === 'sm' ? 'p-3 w-full max-w-[170px]' : size === 'lg' ? 'p-5 w-full max-w-[280px]' : 'p-4 w-full max-w-[220px]'}
      `}
    >
      {/* 1. Large Rounded Top Picture (Photo / Verified Portrait) */}
      <div className="w-full flex justify-center pt-1 pb-3">
        <div className={`
          relative overflow-hidden rounded-[20px] bg-[#1E293B]/80 border border-[#334155]/60 flex items-center justify-center
          ${size === 'sm' ? 'w-24 h-28' : size === 'lg' ? 'w-48 h-56' : 'w-36 h-44'}
        `}>
          <PlayerAvatar
            playerId={player.id}
            nickname={player.nickname}
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>

      {/* 2. Bold Clean Nickname */}
      <div className="w-full text-center pb-3">
        <h3 className="font-display font-black text-xl md:text-2xl text-white tracking-wide truncate">
          {player.nickname}
        </h3>
      </div>

      {/* 3. Triple Bottom Block: [ Team Logo | Country Flag | Position Short Tag ] */}
      <div className="w-full grid grid-cols-3 gap-2 items-center">
        {/* Quad 1: Team Logo */}
        <div className="h-12 rounded-xl bg-[#090D16] border border-[#1E293B] flex items-center justify-center p-1 overflow-hidden" title={player.teamName}>
          <TeamLogo
            teamId={player.teamId}
            name={player.teamName}
            logoText={player.teamName.slice(0, 3).toUpperCase()}
            accentColor="#38BDF8"
            size="sm"
            className="w-full h-full border-0 shadow-none bg-transparent"
          />
        </div>

        {/* Quad 2: Country Flag */}
        <div className="h-12 rounded-xl bg-[#090D16] border border-[#1E293B] flex items-center justify-center p-1.5 overflow-hidden" title={player.countryName || player.country}>
          <div className="w-full h-full rounded-md overflow-hidden flex items-center justify-center shadow-inner">
            <CountryFlag countryCode={player.country} />
          </div>
        </div>

        {/* Quad 3: Pure Clean Pill (Sigla Curta com padding e tamanho perfeito) */}
        <div 
          className={`h-12 rounded-xl ${roleConfig.bgColor} text-white flex items-center justify-center px-1 font-display font-black shadow-md ${roleConfig.shadowColor} overflow-hidden`}
          title={roleConfig.full}
        >
          <span className="text-xs md:text-sm tracking-wider uppercase font-mono font-black text-center drop-shadow-sm select-none">
            {roleConfig.label}
          </span>
        </div>
      </div>

      {/* OVERALL RATING: STRICTLY REVEALED ONLY IN FINAL RESULTS SCREEN */}
      {showOvr && (
        <div className="mt-3 pt-2 border-t border-[#1E293B] w-full flex items-center justify-center gap-1.5 bg-[#090D16] rounded-xl py-2">
          <span className="text-[10px] uppercase font-bold text-cs-muted tracking-wider">OVR</span>
          <span className={`font-display font-black text-xl leading-none ${getOvrColor(player.ovr)}`}>
            {player.ovr}
          </span>
        </div>
      )}

      {/* Selected Indicator Badge Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-black/75 rounded-[24px] flex items-center justify-center backdrop-blur-xs">
          <span className="px-3 py-1.5 bg-[#1E293B] border border-[#334155] text-white text-xs font-bold rounded-lg uppercase tracking-wider">
            Escalado
          </span>
        </div>
      )}
    </div>
  );
};
