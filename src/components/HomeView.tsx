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
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden border border-cs-border bg-gradient-to-b from-cs-surface via-cs-card/80 to-cs-bg p-8 md:p-14 text-center">
        {/* Glow backdrop accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            {t('hero.badge')}
          </div>

          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight uppercase leading-tight">
            {t('hero.title')}
          </h1>

          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                sound.playClick();
                onStartDraft();
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-display font-black text-base tracking-wider uppercase flex items-center justify-center gap-3 shadow-lg hover:scale-105 transition-all"
            >
              <Trophy className="w-5 h-5" />
              <span>{t('hero.startDraft')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate('guess');
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-xl glass-card hover:bg-cs-surface border border-cs-border hover:border-cs-accent/60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>{t('hero.exploreModes')}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-cs-border/60 max-w-xl mx-auto">
            <div>
              <div className="font-display font-black text-2xl md:text-3xl text-amber-400">12+</div>
              <div className="text-xs text-cs-muted">{t('hero.statsTeams')}</div>
            </div>
            <div>
              <div className="font-display font-black text-2xl md:text-3xl text-sky-400">{ALL_PLAYERS.length}+</div>
              <div className="text-xs text-cs-muted">{t('hero.statsLegends')}</div>
            </div>
            <div>
              <div className="font-display font-black text-2xl md:text-3xl text-emerald-400">MR12</div>
              <div className="text-xs text-cs-muted">Simulação Tática</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modes Grid (Focused on Core Game, Guess and Bingo - Builder removed) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-2xl text-white tracking-wider uppercase flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            {t('modes.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Road to Major (Core Game) */}
          <div 
            onClick={() => { sound.playClick(); onStartDraft(); }}
            className="group cursor-pointer rounded-2xl glass-card p-6 border border-cs-border hover:border-amber-400/80 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-amber-400 transition-colors">
                {t('modes.roadToMajor.title')}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('modes.roadToMajor.desc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>{t('modes.playNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Guess the Pro */}
          <div 
            onClick={() => { sound.playClick(); onNavigate('guess'); }}
            className="group cursor-pointer rounded-2xl glass-card p-6 border border-cs-border hover:border-sky-400/80 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-sky-400 transition-colors">
                {t('modes.guess.title')}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('modes.guess.desc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <span>{t('modes.playNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. CS Bingo */}
          <div 
            onClick={() => { sound.playClick(); onNavigate('bingo'); }}
            className="group cursor-pointer rounded-2xl glass-card p-6 border border-cs-border hover:border-purple-400/80 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Grid className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-purple-400 transition-colors">
                {t('modes.bingo.title')}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('modes.bingo.desc')}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <span>{t('modes.playNow')}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Teams Carousel / Showcase */}
      <section className="glass-panel p-6 rounded-2xl border border-cs-border/80">
        <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Equipes Históricas no Banco de Dados</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {HISTORICAL_TEAMS.map(team => (
            <div 
              key={team.id}
              className="p-3 rounded-xl bg-cs-surface/80 border border-cs-border hover:border-amber-400/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-400 font-bold">
                  {team.year}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5 truncate">{team.name}</h4>
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
