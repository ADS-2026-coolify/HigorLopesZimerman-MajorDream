import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Trophy, Flame, Award, Zap, History, BarChart2 } from 'lucide-react';
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
      <div className="glass-panel p-6 rounded-2xl border border-cs-border text-center space-y-2">
        <h2 className="font-display font-black text-3xl text-white uppercase tracking-wide">
          {t('nav.history')}
        </h2>
        <p className="text-slate-300 text-sm">
          Acompanhe suas estatísticas de simulação competitiva e conquistas no Major.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs uppercase font-bold text-slate-400">Total de Campanhas</div>
          <div className="font-display font-black text-3xl text-white mt-1">{totalCampaigns}</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs uppercase font-bold text-amber-400">Títulos de Major</div>
          <div className="font-display font-black text-3xl text-amber-400 mt-1">{totalWins}</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs uppercase font-bold text-emerald-400">Títulos Invictos</div>
          <div className="font-display font-black text-3xl text-emerald-400 mt-1">{invictusWins}</div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-cs-border text-center">
          <div className="text-xs uppercase font-bold text-sky-400">Aproveitamento</div>
          <div className="font-display font-black text-3xl text-sky-400 mt-1">{winRate}%</div>
        </div>
      </div>

      {/* Achievements Badges */}
      <div className="glass-panel p-6 rounded-2xl border border-cs-border space-y-4">
        <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Conquistas Desbloqueáveis</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${totalCampaigns >= 1 ? 'bg-cs-surface border-amber-400/60' : 'bg-cs-surface/40 border-cs-border opacity-50'}`}>
            <Trophy className="w-8 h-8 text-amber-400" />
            <div>
              <div className="font-bold text-sm text-white">Primeiro Major</div>
              <div className="text-xs text-cs-muted">Complete sua primeira campanha</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 ${totalWins >= 1 ? 'bg-cs-surface border-amber-400/60' : 'bg-cs-surface/40 border-cs-border opacity-50'}`}>
            <Award className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="font-bold text-sm text-white">Levantador de Troféu</div>
              <div className="text-xs text-cs-muted">Vença uma Grande Final de Major</div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 ${invictusWins >= 1 ? 'bg-cs-surface border-amber-400/60' : 'bg-cs-surface/40 border-cs-border opacity-50'}`}>
            <Flame className="w-8 h-8 text-red-500" />
            <div>
              <div className="font-bold text-sm text-white">Invictus Legend</div>
              <div className="text-xs text-cs-muted">Conquiste o Major sem perder um único mapa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Campaigns History */}
      <div className="glass-panel p-6 rounded-2xl border border-cs-border space-y-4">
        <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          <span>Histórico de Campanhas Recentes</span>
        </h3>

        {savedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-cs-muted text-sm">
            Nenhuma campanha simulada ainda. Inicie um draft para gravar suas conquistas!
          </div>
        ) : (
          <div className="space-y-3">
            {savedCampaigns.map(c => (
              <div key={c.campaignId} className="p-4 rounded-xl bg-cs-surface border border-cs-border flex items-center justify-between">
                <div>
                  <div className="font-display font-black text-base text-white">{c.teamName}</div>
                  <div className="text-xs text-cs-muted mt-0.5">
                    Elenco: {c.lineup.map(p => p.nickname).join(', ')}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    c.isChampion ? 'bg-amber-400 text-black' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {c.isChampion ? (c.isInvictus ? 'Campeão Invicto' : 'Campeão') : 'Eliminado'}
                  </span>
                  <div className="text-[11px] font-mono text-cs-muted mt-1">
                    {c.userWins}V - {c.userLosses}D
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
