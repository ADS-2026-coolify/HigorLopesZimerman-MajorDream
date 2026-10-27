import React from 'react';

interface TeamLogoProps {
  teamId: string;
  name: string;
  logoText: string;
  accentColor: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  teamId,
  name,
  logoText,
  accentColor,
  className = '',
  size = 'md'
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const dim = sizeMap[size];

  // Specific SVG renders for verified historical CS teams
  const renderLogoGraphic = () => {
    switch (teamId) {
      case 'lg-2016': // Luminosity Gaming
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#00A3E0" strokeWidth="6" />
            <path d="M35 30 V70 H65" stroke="#00A3E0" strokeWidth="8" strokeLinecap="round" />
            <path d="M48 45 H68 V62 H48 Z" fill="#00A3E0" opacity="0.8" />
          </svg>
        );
      case 'astralis-2018': // Astralis
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <polygon points="50,15 62,38 88,38 67,54 75,78 50,62 25,78 33,54 12,38 38,38" fill="#EF4444" />
            <circle cx="50" cy="48" r="8" fill="#0A0D14" />
          </svg>
        );
      case 'navi-2021':
      case 'navi-2024': // Natus Vincere
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <rect x="15" y="25" width="70" height="50" rx="10" fill="#0A0D14" stroke="#FACC15" strokeWidth="4" />
            <path d="M26 65 L40 35 L54 65" stroke="#FACC15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M58 35 V65 L74 35 V65" stroke="#FACC15" strokeWidth="5" strokeLinecap="round" />
          </svg>
        );
      case 'faze-2022': // FaZe Clan
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <path d="M25 25 H75 V40 H45 V50 H70 V62 H45 V78 H25 Z" fill="#EF4444" />
          </svg>
        );
      case 'fnatic-2015': // Fnatic
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <circle cx="50" cy="50" r="42" fill="#FF6B00" />
            <path d="M30 45 L50 25 L70 45 L50 65 Z" fill="#0A0D14" />
            <circle cx="50" cy="45" r="7" fill="#FF6B00" />
          </svg>
        );
      case 'nip-2014': // Ninjas in Pyjamas
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <polygon points="50,15 85,50 50,85 15,50" stroke="#EAB308" strokeWidth="6" fill="#0A0D14" />
            <path d="M40 35 L60 50 L40 65" stroke="#EAB308" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'vitality-2023': // Team Vitality
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <polygon points="50,20 80,45 68,80 32,80 20,45" fill="#FACC15" />
            <polygon points="50,35 68,52 60,70 40,70 32,52" fill="#0A0D14" />
          </svg>
        );
      case 'vp-2014': // Virtus.pro
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <rect x="20" y="20" width="60" height="60" rx="8" fill="#F97316" />
            <path d="M30 35 L50 65 L70 35" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'spirit-2024': // Team Spirit
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <circle cx="50" cy="50" r="42" fill="#0A0D14" stroke="#10B981" strokeWidth="6" />
            <path d="M50 25 C65 25 72 38 72 50 C72 65 58 75 50 75 C42 75 28 65 28 50 C28 38 35 25 50 25 Z" fill="#10B981" opacity="0.9" />
            <circle cx="43" cy="46" r="4" fill="#0A0D14" />
            <circle cx="57" cy="46" r="4" fill="#0A0D14" />
          </svg>
        );
      case 'g2-2023': // G2 Esports
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <circle cx="50" cy="50" r="42" stroke="#EF4444" strokeWidth="6" fill="#0A0D14" />
            <path d="M35 35 H65 V45 H45 V55 H65 V70 H35" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'liquid-2019': // Team Liquid
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <circle cx="50" cy="50" r="42" fill="#0EA5E9" />
            <path d="M35 70 C35 50 45 35 65 30 C58 45 68 55 60 70 Z" fill="#FFFFFF" />
          </svg>
        );
      case 'furia-2019': // FURIA Panther
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <path d="M25 65 C25 45 40 30 70 30 C75 35 78 45 70 55 C60 68 40 70 25 65 Z" fill="#0A0D14" />
            <circle cx="62" cy="42" r="3" fill="#FFFFFF" />
          </svg>
        );
      case 'nrg-2019': // NRG Esports
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <text x="50" y="62" textAnchor="middle" fill="#EF4444" fontSize="32" fontWeight="900" fontFamily="sans-serif">NRG</text>
          </svg>
        );
      case 'renegades-2019': // Renegades Cowboy
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <path d="M20 40 Q50 25 80 40 L70 70 Q50 85 30 70 Z" fill="#8B0000" />
            <path d="M35 50 H65 V60 H35 Z" fill="#FACC15" />
          </svg>
        );
      case 'clg-2015': // Counter Logic Gaming
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <path d="M30 30 H60 V45 H45 V70 H30 Z" fill="#00A3E0" />
            <circle cx="65" cy="55" r="14" stroke="#00A3E0" strokeWidth="6" />
          </svg>
        );
      case 'copenhagen-2014': // Copenhagen Wolves
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none">
            <circle cx="50" cy="50" r="40" stroke="#EAB308" strokeWidth="5" fill="#0A0D14" />
            <text x="50" y="60" textAnchor="middle" fill="#EAB308" fontSize="24" fontWeight="800">CW</text>
          </svg>
        );
      case 'user-team': // Custom User Team Badge
        return (
          <div className="w-full h-full flex items-center justify-center bg-black/80 rounded-full border border-emerald-500/50">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-400" fill="currentColor">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center font-display font-black text-white">
            {logoText}
          </div>
        );
    }
  };

  return (
    <div
      className={`relative rounded-xl flex items-center justify-center bg-cs-surface border border-cs-border shrink-0 select-none ${dim} ${className}`}
      title={name}
      style={{
        borderColor: `${accentColor}40`,
        boxShadow: `0 0 12px -2px ${accentColor}25`
      }}
    >
      {renderLogoGraphic()}
    </div>
  );
};
