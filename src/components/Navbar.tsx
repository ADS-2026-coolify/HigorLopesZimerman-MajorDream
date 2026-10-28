/* Hallmark · redesign: full · keep tab wiring, language toggle, audio control · esports dark tokens */
import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Trophy, HelpCircle, Grid, BarChart3, Volume2, VolumeX, Globe, Zap } from 'lucide-react';
import { sound } from '../utils/sound';

export type NavTab = 'home' | 'draft' | 'guess' | 'bingo' | 'history';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
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

  const navItems = [
    { id: 'home', labelKey: 'nav.brand', icon: null },
    { id: 'draft', labelKey: 'nav.roadToMajor', icon: <Trophy className="w-4 h-4 text-cs-accent" /> },
    { id: 'guess', labelKey: 'nav.guess', icon: <HelpCircle className="w-4 h-4 text-cs-blue" /> },
    { id: 'bingo', labelKey: 'nav.bingo', icon: <Grid className="w-4 h-4 text-cs-accent" /> },
    { id: 'history', labelKey: 'nav.history', icon: <BarChart3 className="w-4 h-4 text-cs-orange" /> },
  ] as const;

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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map(item => {
            if (item.id === 'home') return null;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectTab(item.id as NavTab);
                }}
                className={`
                  flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none
                  ${active 
                    ? 'bg-cs-card text-white border border-cs-accent/40 shadow-sm' 
                    : 'text-cs-text hover:text-white hover:bg-cs-surface border border-transparent'}
                `}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

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

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-cs-border bg-cs-surface overflow-x-auto">
        {navItems.map(item => {
          if (item.id === 'home') return null;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sound.playClick();
                onSelectTab(item.id as NavTab);
              }}
              className={`
                flex flex-col items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none
                ${active ? 'text-cs-accent bg-cs-card border border-cs-accent/30' : 'text-cs-muted'}
              `}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
