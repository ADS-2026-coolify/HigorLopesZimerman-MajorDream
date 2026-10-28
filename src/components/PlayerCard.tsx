/* Hallmark · redesign: full · keep player props, role config, ovr reveal rule · semantic tokens */
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
}

const roleConfigs: Record<string, RoleConfig> = {
  igl: {
    label: 'IGL',
    full: 'In-Game Leader',
    bgColor: 'bg-blue-700',
  },
  awp: {
    label: 'AWP',
    full: 'Sniper (AWPer)',
    bgColor: 'bg-violet-700',
  },
  entry: {
    label: 'ENT',
    full: 'Entry Fragger',
    bgColor: 'bg-red-700',
  },
  rifler: {
    label: 'RIF',
    full: 'Rifler',
    bgColor: 'bg-amber-700',
  },
  lurker: {
    label: 'LURK',
    full: 'Lurker',
    bgColor: 'bg-teal-700',
  },
  support: {
    label: 'SUP',
    full: 'Support',
    bgColor: 'bg-indigo-700',
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
    if (ovr >= 95) return 'text-cs-accent';
    if (ovr >= 90) return 'text-cs-yellow';
    if (ovr >= 85) return 'text-cs-blue';
    return 'text-cs-green';
  };

  const normalizedRole = player.role?.toLowerCase() || 'rifler';
  const roleConfig = roleConfigs[normalizedRole] || {
    label: normalizedRole.slice(0, 3).toUpperCase(),
    full: normalizedRole.toUpperCase(),
    bgColor: 'bg-amber-700',
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onSelect : undefined}
      onKeyDown={handleKeyDown}
      className={`
        relative group select-none
        rounded-2xl bg-cs-card border border-cs-border
        flex flex-col items-center justify-between transition-colors
        ${isClickable ? 'cursor-pointer hover:border-cs-blue motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-blue' : ''}
        ${isSelected ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''}
        ${size === 'sm' ? 'p-3 w-full max-w-[170px]' : size === 'lg' ? 'p-5 w-full max-w-[280px]' : 'p-4 w-full max-w-[220px]'}
      `}
    >
      {/* 1. Large Rounded Top Picture */}
      <div className="w-full flex justify-center pt-1 pb-3">
        <div className={`
          relative overflow-hidden rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center
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
        <h3 className="font-display font-black text-xl md:text-2xl text-white truncate">
          {player.nickname}
        </h3>
      </div>

      {/* 3. Triple Bottom Block: [ Team Logo | Country Flag | Position Short Tag ] */}
      <div className="w-full grid grid-cols-3 gap-2 items-center">
        {/* Quad 1: Team Logo */}
        <div className="h-12 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center p-1 overflow-hidden" title={player.teamName}>
          <TeamLogo
            teamId={player.teamId}
            name={player.teamName}
            logoText={player.teamName.slice(0, 3).toUpperCase()}
            accentColor="#0EA5E9"
            size="sm"
            className="w-full h-full border-0 shadow-none bg-transparent"
          />
        </div>

        {/* Quad 2: Country Flag */}
        <div className="h-12 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center p-1.5 overflow-hidden" title={player.countryName || player.country}>
          <div className="w-full h-full rounded-md overflow-hidden flex items-center justify-center">
            <CountryFlag countryCode={player.country} />
          </div>
        </div>

        {/* Quad 3: Pure Clean Pill */}
        <div 
          className={`h-12 rounded-xl ${roleConfig.bgColor} text-white flex items-center justify-center px-1 font-display font-black overflow-hidden`}
          title={roleConfig.full}
        >
          <span className="text-xs md:text-sm font-black text-center select-none">
            {roleConfig.label}
          </span>
        </div>
      </div>

      {/* OVERALL RATING: STRICTLY REVEALED ONLY IN FINAL RESULTS SCREEN */}
      {showOvr && (
        <div className="mt-3 pt-2 border-t border-cs-border w-full flex items-center justify-center gap-1.5 bg-cs-surface rounded-xl py-2">
          <span className="text-xs font-semibold text-cs-muted">OVR</span>
          <span className={`font-display font-black text-xl leading-none ${getOvrColor(player.ovr)}`}>
            {player.ovr}
          </span>
        </div>
      )}

      {/* Selected Indicator Badge Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center">
          <span className="px-3 py-1.5 bg-cs-surface border border-cs-border text-white text-xs font-semibold rounded-lg">
            Escalado
          </span>
        </div>
      )}
    </div>
  );
};
