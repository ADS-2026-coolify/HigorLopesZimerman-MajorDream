import React, { useState } from 'react';
import { getPlayerPortrait } from '../utils/playerAssets';

interface PlayerAvatarProps {
  playerId: string;
  nickname: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  playerId,
  nickname,
  className = '',
  size = 'md'
}) => {
  const [imgError, setImgError] = useState(false);
  const portrait = getPlayerPortrait(playerId, nickname);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-lg',
    xl: 'w-32 h-32 text-2xl'
  };

  const dim = sizeClasses[size];

  // If verified photo exists and hasn't failed to load
  if (portrait.hasVerifiedImage && portrait.url && !imgError) {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-cs-surface border border-cs-border shrink-0 select-none ${dim} ${className}`}>
        <img
          src={portrait.url}
          alt={nickname}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  // Strict neutral fallback avatar (initials + dark esports gradient)
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-cs-surface to-cs-card border border-cs-border flex items-center justify-center shrink-0 select-none font-display font-black text-slate-300 ${dim} ${className}`}
      title={nickname}
    >
      <span>{portrait.initials}</span>
      <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl" />
    </div>
  );
};
