/* Hallmark · redesign: full · keep campaign states, metrics, wiring · esports dark tokens */
import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Trophy, Flame, Award, History } from 'lucide-react';
import { CampaignState } from '../types';

interface HistoryStatsProps {
  savedCampaigns: CampaignState[];
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ savedCampaigns }) => {
  const { t } = useI18n();

  const totalCampaigns = savedCampaigns.length;
  const totalWins = savedCampaigns.filter(c => c.isChampion).length;
  const invictusWins = savedCampaigns.filter(c => c.isInvictus).length;
  const winRate = totalCampaigns > 0 ? Math.round((totalWins / totalCampaigns) * 100) : 0;

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border text-center space-y-2">
        <h2 className="font-display font-black text-3xl text-white">
          {t('nav.history')}
        </h2>
        <p className="text-cs-muted text-sm max-w-xl mx-auto">
          Acompanhe suas estatísticas de simulação competitiva e conquistas no Major.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cs-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs font-semibold text-cs-muted">Total de campanhas</div>
          <div className="font-display font-black text-3xl text-white mt-1">{totalCampaigns}</div>
        </div>

        <div className="bg-cs-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs font-semibold text-cs-accent">Títulos de Major</div>
          <div className="font-display font-black text-3xl text-cs-accent mt-1">{totalWins}</div>
        </div>

        <div className="bg-cs-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs font-semibold text-cs-green">Títulos invictos</div>
          <div className="font-display font-black text-3xl text-cs-green mt-1">{invictusWins}</div>
        </div>

        <div className="bg-cs-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs font-semibold text-cs-blue">Aproveitamento</div>
          <div className="font-display font-black text-3xl text-cs-blue mt-1">{winRate}%</div>
        </div>
      </div>

      {/* Achievements Badges */}
      <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border space-y-4">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-cs-accent" />
          <span>Conquistas desbloqueáveis</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
            totalCampaigns >= 1 
              ? 'bg-cs-card border-cs-accent/60' 
              : 'bg-cs-card/40 border-cs-border opacity-50'
          }`}>
            <Trophy className="w-8 h-8 text-cs-accent shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">Primeiro Major</div>
              <div className="text-xs text-cs-muted">Complete sua primeira campanha</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
            totalWins >= 1 
              ? 'bg-cs-card border-cs-accent/60' 
              : 'bg-cs-card/40 border-cs-border opacity-50'
          }`}>
            <Award className="w-8 h-8 text-cs-yellow shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">Levantador de troféu</div>
              <div className="text-xs text-cs-muted">Vença uma Grande Final de Major</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
            invictusWins >= 1 
              ? 'bg-cs-card border-cs-accent/60' 
              : 'bg-cs-card/40 border-cs-border opacity-50'
          }`}>
            <Flame className="w-8 h-8 text-cs-red shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">Invictus legend</div>
              <div className="text-xs text-cs-muted">Conquiste o Major sem perder mapas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Campaigns History */}
      <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border space-y-4">
        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <History className="w-5 h-5 text-cs-muted" />
          <span>Histórico de campanhas recentes</span>
        </h3>

        {savedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-cs-muted text-sm">
            Nenhuma campanha simulada ainda. Inicie um draft para gravar suas conquistas!
          </div>
        ) : (
          <div className="space-y-3">
            {savedCampaigns.map(c => (
              <div key={c.campaignId} className="p-4 rounded-xl bg-cs-card border border-cs-border flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-base text-white">{c.teamName}</div>
                  <div className="text-xs text-cs-muted mt-0.5">
                    Elenco: {c.lineup.map(p => p.nickname).join(', ')}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    c.isChampion ? 'bg-cs-accent text-black' : 'bg-cs-red/20 text-cs-red'
                  }`}>
                    {c.isChampion ? (c.isInvictus ? 'Campeão invicto' : 'Campeão') : 'Eliminado'}
                  </span>
                  <div className="text-xs text-cs-muted mt-1">
                    {c.userWins}V, {c.userLosses}D
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
