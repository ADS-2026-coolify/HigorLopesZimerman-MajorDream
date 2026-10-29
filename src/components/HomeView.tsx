/* Hallmark · redesign: full · keep handlers, wiring, i18n copy · esports dark system */
import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/sound';
import { NavTab } from './Navbar';
import { HISTORICAL_TEAMS, ALL_PLAYERS } from '../data/csData';

interface HomeViewProps {
  onStartDraft: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartDraft }) => {
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
