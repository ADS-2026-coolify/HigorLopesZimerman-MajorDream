import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { ACTIVE_MAPS } from '../data/csData';
import { sound } from '../utils/sound';
import { Plus, Minus, ArrowRight, MapPin } from 'lucide-react';

interface MapAdvantageProps {
  onConfirm: (mapPoints: Record<string, number>) => void;
  onBack: () => void;
}

export const MapAdvantage: React.FC<MapAdvantageProps> = ({ onConfirm, onBack }) => {
  const { t } = useI18n();
  const TOTAL_POINTS = 5;
  const [points, setPoints] = useState<Record<string, number>>({
    mirage: 1,
    inferno: 1,
    nuke: 1,
    dust2: 1,
    ancient: 1,
    anubis: 0,
    overpass: 0,
  });

  const usedPoints = Object.values(points).reduce((a, b) => a + b, 0);
  const remainingPoints = TOTAL_POINTS - usedPoints;

  const handleAdd = (mapId: string) => {
    if (remainingPoints <= 0) return;
    sound.playClick();
    setPoints(prev => ({
      ...prev,
      [mapId]: (prev[mapId] || 0) + 1
    }));
  };

  const handleRemove = (mapId: string) => {
    if ((points[mapId] || 0) <= 0) return;
    sound.playClick();
    setPoints(prev => ({
      ...prev,
      [mapId]: (prev[mapId] || 0) - 1
    }));
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
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${count > 0 ? 'bg-amber-400 text-black' : 'bg-cs-surface text-slate-400'}`}>
                    +{count * 1.5} OVR
                  </span>
                </div>

                <h3 className="font-display font-black text-xl text-white">
                  de_{m.name.toLowerCase()}
                </h3>
              </div>

              {/* Point controls */}
              <div className="flex items-center justify-between mt-6 pt-3 border-t border-cs-border/60">
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
                    disabled={remainingPoints <= 0}
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
          onClick={() => {
            sound.playClick();
            onConfirm(points);
          }}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <span>{t('maps.simulateCampaign')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
