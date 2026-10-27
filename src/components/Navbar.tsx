import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Trophy, HelpCircle, Grid, BarChart3, Volume2, VolumeX, Globe } from 'lucide-react';
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
    { id: 'draft', labelKey: 'nav.roadToMajor', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { id: 'guess', labelKey: 'nav.guess', icon: <HelpCircle className="w-4 h-4 text-sky-400" /> },
    { id: 'bingo', labelKey: 'nav.bingo', icon: <Grid className="w-4 h-4 text-purple-400" /> },
    { id: 'history', labelKey: 'nav.history', icon: <BarChart3 className="w-4 h-4 text-orange-400" /> },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-cs-border/60 bg-cs-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => { sound.playClick(); onSelectTab('home'); }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-display font-black text-black text-xl shadow-glow-gold">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black tracking-wider text-xl text-white group-hover:text-amber-400 transition-colors">
              DRAFT<span className="text-amber-400">ARENA</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-cs-muted -mt-1">
              Major Simulation
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            if (item.id === 'home') return null;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  onSelectTab(item.id as NavTab);
                }}
                className={`
                  flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all
                  ${active 
                    ? 'bg-cs-card text-white border border-cs-accent/40 shadow-glow-gold' 
                    : 'text-slate-300 hover:text-white hover:bg-cs-surface border border-transparent'}
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
            onClick={toggleSound}
            title={t('common.sound')}
            className="p-2 rounded-lg bg-cs-surface hover:bg-cs-card border border-cs-border text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          <button
            onClick={toggleLang}
            title="Mudar idioma / Switch language"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cs-surface hover:bg-cs-card border border-cs-border text-xs font-mono font-bold text-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cs-accent" />
            <span>{locale === 'pt-BR' ? 'PT' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-cs-border/40 bg-cs-surface/90 overflow-x-auto">
        {navItems.map(item => {
          if (item.id === 'home') return null;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                onSelectTab(item.id as NavTab);
              }}
              className={`
                flex flex-col items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap
                ${active ? 'text-amber-400 bg-cs-card border border-cs-accent/30' : 'text-slate-400'}
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
