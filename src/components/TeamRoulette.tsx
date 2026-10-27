import React, { useState, useEffect, useRef } from 'react';
import { HistoricalTeam } from '../types';
import { TeamLogo } from './TeamLogo';

interface TeamRouletteProps {
  teams: HistoricalTeam[];
  onTeamSelected: (team: HistoricalTeam) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
}

export const TeamRoulette: React.FC<TeamRouletteProps> = ({
  teams,
  onTeamSelected,
  isDrawing,
  setIsDrawing
}) => {
  const [reelItems, setReelItems] = useState<HistoricalTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<HistoricalTeam | null>(null);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [isAnimationFinished, setIsAnimationFinished] = useState<boolean>(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const hasAutoStarted = useRef<boolean>(false);

  // Check if system prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Build an elongated reel of logos for the roulette mechanism
  useEffect(() => {
    if (teams.length === 0) return;
    const extended: HistoricalTeam[] = [];
    for (let i = 0; i < 12; i++) {
      extended.push(...teams);
    }
    setReelItems(extended);
  }, [teams]);

  // AUTO-START ROULETTE as soon as reel is ready and page/step loads
  useEffect(() => {
    if (reelItems.length > 0 && !hasAutoStarted.current && !isDrawing && !isAnimationFinished) {
      hasAutoStarted.current = true;
      // Slight delay so DOM layout has settled for container width
      const timer = setTimeout(() => {
        triggerSpin();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [reelItems]);

  const triggerSpin = () => {
    if (teams.length === 0) return;
    setIsDrawing(true);
    setIsAnimationFinished(false);
    setSelectedTeam(null);

    // Fair random pick from eligible teams
    const winningTeam = teams[Math.floor(Math.random() * teams.length)];

    if (prefersReducedMotion) {
      setTimeout(() => {
        setSelectedTeam(winningTeam);
        setIsDrawing(false);
        setIsAnimationFinished(true);
        setTimeout(() => onTeamSelected(winningTeam), 600);
      }, 400);
      return;
    }

    // Roulette parameters: item width 112px (96px card + 16px gap)
    const itemWidth = 112;
    const targetBaseIndex = 65 + Math.floor(Math.random() * (teams.length * 2));
    let targetIndex = targetBaseIndex;
    while (reelItems[targetIndex]?.id !== winningTeam.id && targetIndex < reelItems.length - 1) {
      targetIndex++;
    }
    if (!reelItems[targetIndex] || reelItems[targetIndex].id !== winningTeam.id) {
      targetIndex = targetBaseIndex;
    }

    const containerWidth = reelRef.current ? reelRef.current.clientWidth : 600;
    const centerOffset = containerWidth / 2 - itemWidth / 2;
    const finalOffset = targetIndex * itemWidth - centerOffset;

    setScrollOffset(finalOffset);

    // Complete spin in 3.2s quietly
    setTimeout(() => {
      setSelectedTeam(winningTeam);
      setIsDrawing(false);
      setIsAnimationFinished(true);
      setTimeout(() => {
        onTeamSelected(winningTeam);
      }, 900);
    }, 3200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-center">
      {/* Title & Instructions */}
      <div className="space-y-1">
        <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight uppercase">
          Sorteando Equipe...
        </h2>
        <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto">
          A roleta está sorteando a equipe do próximo jogador para a sua escalação.
        </p>
      </div>

      {/* Central Roulette Reel Box */}
      <div className="relative rounded-2xl glass-panel p-5 border border-cs-border overflow-hidden shadow-2xl">
        {/* Center Target Indicator Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-amber-400 z-20 pointer-events-none shadow-[0_0_12px_rgba(245,158,11,0.8)]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-amber-400" />
        </div>

        {/* Horizontal Reel Track */}
        <div ref={reelRef} className="relative w-full h-32 overflow-hidden flex items-center">
          <div
            className="flex items-center gap-4 will-change-transform"
            style={{
              transform: `translateX(-${scrollOffset}px)`,
              transition: isDrawing
                ? 'transform 3.2s cubic-bezier(0.12, 0.8, 0.22, 1)'
                : 'none'
            }}
          >
            {reelItems.map((team, idx) => (
              <div
                key={`${team.id}_${idx}`}
                className="w-24 h-28 shrink-0 rounded-xl bg-cs-surface border border-cs-border/80 flex flex-col items-center justify-center p-2 text-center"
              >
                <TeamLogo
                  teamId={team.id}
                  name={team.name}
                  logoText={team.logoText}
                  accentColor={team.accentColor}
                  size="md"
                />
                <span className="font-display font-bold text-[11px] text-slate-300 mt-2 truncate w-full">
                  {team.name}
                </span>
                <span className="text-[10px] font-mono text-cs-muted">
                  {team.year}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Team Reveal Announcement */}
        {selectedTeam && isAnimationFinished && (
          <div className="mt-4 pt-3 border-t border-cs-border flex items-center justify-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Equipe Selecionada:
            </span>
            <span className="font-display font-black text-lg text-white">
              {selectedTeam.name} ({selectedTeam.year})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
