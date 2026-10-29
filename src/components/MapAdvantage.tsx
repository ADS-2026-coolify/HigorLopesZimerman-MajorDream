/* Hallmark · redesign: full · keep map point allocation, proficiency engine, sound · semantic tokens */
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
      <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border text-center space-y-3">
        <h2 className="font-display font-black text-3xl text-white">
          {t('maps.title')}
        </h2>
        <p className="text-cs-muted text-sm max-w-lg mx-auto">
          {t('maps.desc')}
        </p>

        {/* Counter */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-cs-card border border-cs-border">
            <span className="text-xs font-semibold text-cs-muted">
              {t('maps.remainingPoints')}:
            </span>
            <span className={`font-display font-black text-2xl ${remainingPoints === 0 ? 'text-cs-green' : 'text-cs-accent'}`}>
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
                relative overflow-hidden rounded-xl border p-4 transition-colors flex flex-col justify-between
                ${count > 0 ? 'border-cs-accent bg-cs-card' : 'border-cs-border bg-cs-surface'}
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cs-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cs-accent" />
                    {m.activeDuty ? 'Active Duty' : 'Reserva'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded shadow-sm ${tier.badgeBg}`}>
                    {finalProf}%
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white">
                  de_{m.name.toLowerCase()}
                </h3>

                <span className="text-[11px] font-mono text-cs-muted block mt-1">
                  Base: {baseProf}% · {count} pt{count !== 1 ? 's' : ''} ({count > 0 ? `+${count * 5}%` : '+0%'})
                </span>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-cs-bg overflow-hidden p-0.5 mt-3">
                  <div
                    className={`h-full rounded-full ${tier.barGradient} transition-colors`}
                    style={{ width: `${finalProf}%` }}
                  />
                </div>
              </div>

              {/* Point controls */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-cs-border/60">
                <span className="text-xs text-cs-muted font-mono">
                  {count} {t('maps.allocated')}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={count <= 0}
                    onClick={() => handleRemove(m.id)}
                    className="w-8 h-8 rounded-lg bg-cs-surface hover:bg-cs-border active:scale-[0.98] border border-cs-border flex items-center justify-center text-white disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={remainingPoints <= 0 || isAtMax}
                    onClick={() => handleAdd(m.id)}
                    className="w-8 h-8 rounded-lg bg-cs-accent/20 hover:bg-cs-accent active:scale-[0.98] border border-cs-accent/40 text-cs-accent hover:text-black flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
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
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-cs-muted hover:text-white active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none px-4 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
        >
          ← {t('common.back')}
        </button>

        <button
          type="button"
          disabled={remainingPoints > 0}
          onClick={() => {
            sound.playClick();
            onConfirm(points, baseProficiencies);
          }}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cs-accent hover:bg-cs-accentHover active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-black font-display font-black text-base whitespace-nowrap flex items-center justify-center gap-2 shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          title={remainingPoints > 0 ? `Distribua todos os pontos (${remainingPoints} restante${remainingPoints > 1 ? 's' : ''})` : t('maps.simulateCampaign')}
        >
          <span>{remainingPoints > 0 ? `Faltam ${remainingPoints} pts` : t('maps.simulateCampaign')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
