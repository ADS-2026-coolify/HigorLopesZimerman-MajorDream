import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { ACTIVE_MAPS } from '../data/csData';
import {
  calculateFinalProficiency,
  getProficiencyTier,
  getOrInitDraftBaseProficiencies,
  getSavedDraftAllocatedPoints,
  saveDraftAllocatedPoints
} from '../utils/mapProficiency';
import { sound } from '../utils/sound';
import { Plus, Minus, ArrowRight, MapPin } from 'lucide-react';

interface MapAdvantageProps {
  onConfirm: (mapPoints: Record<string, number>, baseProficiencies?: Record<string, number>) => void;
  onBack: () => void;
}

export const MapAdvantage: React.FC<MapAdvantageProps> = ({ onConfirm, onBack }) => {
  const { t } = useI18n();
  const TOTAL_POINTS = 5;
  const [baseProficiencies] = useState<Record<string, number>>(() => getOrInitDraftBaseProficiencies());
  const [points, setPoints] = useState<Record<string, number>>(() => {
    const saved = getSavedDraftAllocatedPoints();
    if (saved) return saved;
    return {
      mirage: 0,
      inferno: 0,
      nuke: 0,
      dust2: 0,
      ancient: 0,
      anubis: 0,
      overpass: 0,
    };
  });

  const usedPoints = Object.values(points).reduce((a, b) => a + b, 0);
  const remainingPoints = TOTAL_POINTS - usedPoints;

  const handleAdd = (mapId: string) => {
    if (remainingPoints <= 0) return;
    const current = points[mapId] || 0;
    const base = baseProficiencies[mapId] ?? 50;
    if (base + (current + 1) * 5 > 100) return;

    sound.playClick();
    setPoints(prev => {
      const next = {
        ...prev,
        [mapId]: (prev[mapId] || 0) + 1
      };
      saveDraftAllocatedPoints(next);
      return next;
    });
  };

  const handleRemove = (mapId: string) => {
    if ((points[mapId] || 0) <= 0) return;
    sound.playClick();
    setPoints(prev => {
      const next = {
        ...prev,
        [mapId]: (prev[mapId] || 0) - 1
      };
      saveDraftAllocatedPoints(next);
      return next;
    });
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-cs-border text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <span>{t('maps.title')}</span>
        </div>
        <h2 className="font-display font-black text-3xl text-white uppercase tracking-wide">
          {t('maps.title')}
        </h2>
        <p className="text-slate-300 text-sm max-w-lg mx-auto">
          {t('maps.desc')}
        </p>

        {/* Counter */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-cs-surface border border-cs-border">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t('maps.remainingPoints')}:
            </span>
            <span className={`font-display font-black text-2xl ${remainingPoints === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {remainingPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Map Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ACTIVE_MAPS.map(m => {
          const count = points[m.id] || 0;
          const baseProf = baseProficiencies[m.id] ?? 50;
          const finalProf = calculateFinalProficiency(baseProf, count);
          const isAtMax = finalProf >= 100 || (baseProf + (count + 1) * 5 > 100);
          const tier = getProficiencyTier(finalProf);

          return (
            <div
              key={m.id}
              className={`
                relative overflow-hidden rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between
                ${count > 0 ? 'border-amber-400/80 bg-cs-card' : 'border-cs-border bg-cs-surface/60'}
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {m.activeDuty ? 'Active Duty' : 'Reserva'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded shadow ${tier.badgeBg}`}>
                    {finalProf}%
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white">
                  de_{m.name.toLowerCase()}
                </h3>

                <span className="text-[11px] font-mono text-slate-400 block mt-1">
                  Base: {baseProf}% · {count} pt{count !== 1 ? 's' : ''} ({count > 0 ? `+${count * 5}%` : '+0%'})
                </span>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden p-0.5 mt-3">
                  <div
                    className={`h-full rounded-full ${tier.barGradient} ${tier.glow} transition-all duration-300`}
                    style={{ width: `${finalProf}%` }}
                  />
                </div>
              </div>

              {/* Point controls */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-cs-border/60">
                <span className="text-xs text-slate-300 font-mono">
                  {count} {t('maps.allocated')}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={count <= 0}
                    onClick={() => handleRemove(m.id)}
                    className="w-8 h-8 rounded-lg bg-cs-surface hover:bg-cs-border border border-cs-border flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    disabled={remainingPoints <= 0 || isAtMax}
                    onClick={() => handleAdd(m.id)}
                    className="w-8 h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-slate-400 hover:text-white px-4 py-2"
        >
          ← {t('common.back')}
        </button>

        <button
          disabled={remainingPoints > 0}
          onClick={() => {
            sound.playClick();
            onConfirm(points, baseProficiencies);
          }}
          className={`w-full sm:w-auto px-8 py-4 rounded-xl font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            remainingPoints > 0
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black hover:scale-105 cursor-pointer'
          }`}
          title={remainingPoints > 0 ? `Distribua todos os pontos (${remainingPoints} restante${remainingPoints > 1 ? 's' : ''})` : t('maps.simulateCampaign')}
        >
          <span>{remainingPoints > 0 ? `Distribua os Pontos (${remainingPoints} rest.)` : t('maps.simulateCampaign')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
