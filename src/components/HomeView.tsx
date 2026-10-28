/* Hallmark · redesign: full · keep handlers, wiring, i18n copy · esports dark system */
import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Trophy, HelpCircle, Grid, Flame, ArrowRight, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/sound';
import { NavTab } from './Navbar';
import { HISTORICAL_TEAMS, ALL_PLAYERS } from '../data/csData';

interface HomeViewProps {
  onStartDraft: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartDraft, onNavigate }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section — Clean Esports Tactical Command Center */}
      <section className="relative rounded-2xl border border-cs-border bg-cs-surface p-7 sm:p-10 lg:p-12 text-center overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white leading-tight">
            {t('hero.title')}
          </h1>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-cs-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-cs-accent" />
            <span>{t('hero.badge')}</span>
          </div>

          <p className="text-cs-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onStartDraft();
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-cs-accent hover:bg-cs-accentHover active:brightness-95 disabled:opacity-50 disabled:pointer-events-none text-black font-display font-bold text-base flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-cs-accent/20 focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cs-bg focus-visible:outline-none"
            >
              <Trophy className="w-5 h-5" />
              <span>{t('hero.startDraft')}</span>
              <ArrowRight className="w-4 h-4 transition-transform motion-safe:group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onNavigate('guess');
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cs-card hover:bg-cs-hover active:brightness-95 disabled:opacity-50 disabled:pointer-events-none border border-cs-border hover:border-cs-accent/60 text-cs-text font-semibold text-sm flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-cs-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cs-bg focus-visible:outline-none"
            >
              <HelpCircle className="w-4 h-4 text-cs-blue" />
              <span>{t('hero.exploreModes')}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-cs-border max-w-xl mx-auto">
            <div>
              <div className="font-display font-black text-2xl md:text-3xl text-cs-accent">12+</div>
              <div className="text-xs text-cs-muted mt-0.5">{t('hero.statsTeams')}</div>
            </div>
            <div>
              <div className="font-display font-black text-2xl md:text-3xl text-cs-blue">{ALL_PLAYERS.length}+</div>
              <div className="text-xs text-cs-muted mt-0.5">{t('hero.statsLegends')}</div>
            </div>
            <div>
              <div className="font-display font-black text-2xl md:text-3xl text-cs-green">MR12</div>
              <div className="text-xs text-cs-muted mt-0.5">Simulação Tática</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modes Grid */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-2xl text-white flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-cs-accent" />
            <span>{t('modes.title')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Road to Major (Core Game) */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => { sound.playClick(); onStartDraft(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { sound.playClick(); onStartDraft(); } }}
            className="group cursor-pointer rounded-2xl bg-cs-card p-6 border border-cs-border hover:border-cs-accent active:brightness-95 transition-colors flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center text-cs-accent">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-white group-hover:text-cs-accent transition-colors">
                {t('modes.roadToMajor.title')}
              </h3>
              <p className="text-xs text-cs-muted leading-relaxed">
                {t('modes.roadToMajor.desc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-cs-accent">
              <span>{t('modes.playNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform motion-safe:group-hover:translate-x-1 motion-reduce:transform-none" />
            </div>
          </div>

          {/* 2. Guess the Pro */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => { sound.playClick(); onNavigate('guess'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { sound.playClick(); onNavigate('guess'); } }}
            className="group cursor-pointer rounded-2xl bg-cs-card p-6 border border-cs-border hover:border-cs-blue active:brightness-95 transition-colors flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-cs-blue focus-visible:outline-none"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center text-cs-blue">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-white group-hover:text-cs-blue transition-colors">
                {t('modes.guess.title')}
              </h3>
              <p className="text-xs text-cs-muted leading-relaxed">
                {t('modes.guess.desc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-cs-blue">
              <span>{t('modes.playNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform motion-safe:group-hover:translate-x-1 motion-reduce:transform-none" />
            </div>
          </div>

          {/* 3. CS Bingo */}
          <div 
            role="button"
            tabIndex={0}
            onClick={() => { sound.playClick(); onNavigate('bingo'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { sound.playClick(); onNavigate('bingo'); } }}
            className="group cursor-pointer rounded-2xl bg-cs-card p-6 border border-cs-border hover:border-cs-accent active:brightness-95 transition-colors flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-center text-cs-accent">
                <Grid className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-white group-hover:text-cs-accent transition-colors">
                {t('modes.bingo.title')}
              </h3>
              <p className="text-xs text-cs-muted leading-relaxed">
                {t('modes.bingo.desc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-cs-accent">
              <span>{t('modes.playNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform motion-safe:group-hover:translate-x-1 motion-reduce:transform-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Teams Showcase */}
      <section className="p-6 rounded-2xl border border-cs-border bg-cs-surface">
        <h3 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cs-accent" />
          <span>Equipes Históricas no Banco de Dados</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {HISTORICAL_TEAMS.map(team => (
            <div 
              key={team.id}
              className="p-3 rounded-xl bg-cs-card border border-cs-border hover:border-cs-accent/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-cs-surface text-cs-accent font-semibold border border-cs-border">
                  {team.year}
                </span>
                <h4 className="font-semibold text-sm text-cs-text mt-2 truncate">{team.name}</h4>
              </div>
              <div className="text-[11px] text-cs-muted mt-2">
                {team.roster.length} jogadores lendários
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
