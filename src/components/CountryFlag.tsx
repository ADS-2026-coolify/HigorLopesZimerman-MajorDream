import React from 'react';

interface CountryFlagProps {
  countryCode: string; // "BR", "UA", "DK", "FR", "BA", "SE", "PL", "RU", "NO", "LV", "EE", "CA", "US", "FI", "LT", "RO", "IL", "AU"
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ countryCode, className = 'w-full h-full' }) => {
  const code = countryCode.toUpperCase();

  switch (code) {
    case 'BR': // Brasil (Green background, yellow rhombus, blue circle with white band)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#009C3B" />
          <polygon points="50,7 92,35 50,63 8,35" fill="#FFDF00" />
          <circle cx="50" cy="35" r="16" fill="#002776" />
          <path d="M 35,37 Q 50,31 65,37" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
        </svg>
      );
    case 'DK': // Denmark (Red background with white Nordic cross)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#C8102E" />
          <rect x="30" width="12" height="70" fill="#FFFFFF" />
          <rect y="29" width="100" height="12" fill="#FFFFFF" />
        </svg>
      );
    case 'UA': // Ukraine (Blue top, Yellow bottom)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="35" fill="#0057B7" />
          <rect y="35" width="100" height="35" fill="#FFDD00" />
        </svg>
      );
    case 'FR': // France (Blue, White, Red vertical tricolor)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="33.33" height="70" fill="#002395" />
          <rect x="33.33" width="33.34" height="70" fill="#FFFFFF" />
          <rect x="66.67" width="33.33" height="70" fill="#ED2939" />
        </svg>
      );
    case 'SE': // Sweden (Blue background with yellow Nordic cross)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#006AA7" />
          <rect x="30" width="14" height="70" fill="#FECC00" />
          <rect y="28" width="100" height="14" fill="#FECC00" />
        </svg>
      );
    case 'PL': // Poland (White top, Red bottom)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="35" fill="#FFFFFF" />
          <rect y="35" width="100" height="35" fill="#DC143C" />
        </svg>
      );
    case 'RU': // Russia (White, Blue, Red horizontal)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="23.33" fill="#FFFFFF" />
          <rect y="23.33" width="100" height="23.34" fill="#0039A6" />
          <rect y="46.67" width="100" height="23.33" fill="#D52B1E" />
        </svg>
      );
    case 'BA': // Bosnia and Herzegovina (Blue with yellow triangle and stars)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#002395" />
          <polygon points="25,0 75,0 75,70" fill="#FECB00" />
          <line x1="20" y1="5" x2="70" y2="65" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="3 4" />
        </svg>
      );
    case 'NO': // Norway (Red with blue Nordic cross bordered with white)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#BA0C2F" />
          <rect x="28" width="16" height="70" fill="#FFFFFF" />
          <rect y="27" width="100" height="16" fill="#FFFFFF" />
          <rect x="32" width="8" height="70" fill="#00205B" />
          <rect y="31" width="100" height="8" fill="#00205B" />
        </svg>
      );
    case 'US': // USA (Stars and Stripes)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#B22234" />
          {[1, 3, 5].map(i => (
            <rect key={i} y={i * 10} width="100" height="10" fill="#FFFFFF" />
          ))}
          <rect width="45" height="35" fill="#3C3B6E" />
          <circle cx="22.5" cy="17.5" r="8" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );
    case 'CA': // Canada (Red, White, Red with maple leaf shape)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="25" height="70" fill="#FF0000" />
          <rect x="25" width="50" height="70" fill="#FFFFFF" />
          <rect x="75" width="25" height="70" fill="#FF0000" />
          <polygon points="50,20 54,30 65,30 56,38 60,48 50,42 40,48 44,38 35,30 46,30" fill="#FF0000" />
        </svg>
      );
    case 'FI': // Finland (White with blue Nordic cross)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#FFFFFF" />
          <rect x="30" width="14" height="70" fill="#003580" />
          <rect y="28" width="100" height="14" fill="#003580" />
        </svg>
      );
    case 'LT': // Lithuania (Yellow, Green, Red horizontal)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="23.33" fill="#FDB913" />
          <rect y="23.33" width="100" height="23.34" fill="#006A44" />
          <rect y="46.67" width="100" height="23.33" fill="#C1272D" />
        </svg>
      );
    case 'IL': // Israel (White with blue stripes and Star of David)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#FFFFFF" />
          <rect y="10" width="100" height="8" fill="#0038B8" />
          <rect y="52" width="100" height="8" fill="#0038B8" />
          <polygon points="50,26 58,42 42,42" stroke="#0038B8" strokeWidth="2.5" fill="none" />
          <polygon points="50,44 58,28 42,28" stroke="#0038B8" strokeWidth="2.5" fill="none" />
        </svg>
      );
    case 'AU': // Australia (Blue with Union Jack & Southern Cross)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="70" fill="#00008B" />
          <rect width="45" height="32" fill="#00247D" />
          <line x1="0" y1="0" x2="45" y2="32" stroke="#FFFFFF" strokeWidth="3" />
          <line x1="0" y1="32" x2="45" y2="0" stroke="#FFFFFF" strokeWidth="3" />
          <rect x="20" width="5" height="32" fill="#CF142B" />
          <rect y="13.5" width="45" height="5" fill="#CF142B" />
          <circle cx="75" cy="35" r="4" fill="#FFFFFF" />
        </svg>
      );
    case 'EE': // Estonia (Blue, Black, White horizontal)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="23.33" fill="#0072CE" />
          <rect y="23.33" width="100" height="23.34" fill="#000000" />
          <rect y="46.67" width="100" height="23.33" fill="#FFFFFF" />
        </svg>
      );
    case 'LV': // Latvia (Carmine red with narrow white central stripe)
      return (
        <svg aria-hidden="true" viewBox="0 0 100 70" className={className}>
          <rect width="100" height="28" fill="#9E3039" />
          <rect y="28" width="100" height="14" fill="#FFFFFF" />
          <rect y="42" width="100" height="28" fill="#9E3039" />
        </svg>
      );
    default:
      return (
        <div className="w-full h-full bg-cs-surface flex items-center justify-center font-mono font-bold text-xs text-white">
          {code}
        </div>
      );
  }
};
