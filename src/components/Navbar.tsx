/* Hallmark · redesign: full · keep tab wiring, language toggle, audio control · esports dark tokens */
import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Volume2, VolumeX, Globe, Zap } from 'lucide-react';
import { sound } from '../utils/sound';

export type NavTab = 'home' | 'draft' | 'guess' | 'bingo' | 'history';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectTab }) => {
  const { locale, setLocale, t } = useI18n();
  const [soundEnabled, setSoundEnabled] = React.useState(sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) sound.playClick();
  };

  const toggleLang = () => {
    sound.playClick();
    setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cs-border bg-cs-bg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => { sound.playClick(); onSelectTab('home'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { sound.playClick(); onSelectTab('home'); } }}
          className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-lg bg-cs-accent flex items-center justify-center font-display font-black text-black shadow-lg shadow-cs-accent/20">
            <Zap className="w-5 h-5 text-black fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black tracking-normal text-xl text-white group-hover:text-cs-accent transition-colors">
              DRAFT<span className="text-cs-accent">ARENA</span>
            </span>
            <span className="text-[11px] text-cs-muted -mt-1">
              Major Simulation
            </span>
          </div>
        </div>

        {/* Global Controls: Audio & Language */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            title={t('common.sound')}
            className="p-2 rounded-lg bg-cs-surface hover:bg-cs-card active:scale-95 disabled:opacity-50 disabled:pointer-events-none border border-cs-border text-cs-text hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cs-green" /> : <VolumeX className="w-4 h-4 text-cs-red" />}
          </button>

          <button
            type="button"
            onClick={toggleLang}
            title="Mudar idioma / Switch language"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cs-surface hover:bg-cs-card active:scale-95 disabled:opacity-50 disabled:pointer-events-none border border-cs-border text-xs font-semibold text-cs-text transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            <Globe className="w-3.5 h-3.5 text-cs-accent" />
            <span>{locale === 'pt-BR' ? 'PT' : 'EN'}</span>
          </button>
        </div>
      </div>

    </header>
  );
};
