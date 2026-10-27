import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Player } from '../types';
import { ALL_PLAYERS } from '../data/csData';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { Grid, Flame, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { PlayerCard } from './PlayerCard';

interface BingoSquare {
  id: number;
  label: string;
  check: (p: Player) => boolean;
  filledBy: Player | null;
}

export const CSBingoGame: React.FC = () => {
  const { t } = useI18n();

  // 16 squares (4x4)
  const initialSquares: BingoSquare[] = [
    { id: 0, label: 'Lenda Brasileira 🇧🇷', check: p => p.country === 'BR', filledBy: null },
    { id: 1, label: 'OVR 95+ (Estrela)', check: p => p.ovr >= 95, filledBy: null },
    { id: 2, label: 'AWPer de Ofício', check: p => p.role === 'awp', filledBy: null },
    { id: 3, label: 'Era 2013-2016', check: p => p.eraGroup === '2013-2016', filledBy: null },

    { id: 4, label: 'Capitão / IGL', check: p => p.role === 'igl', filledBy: null },
    { id: 5, label: 'Mais de 2 Majors', check: p => (p.stats.majorsWon || 0) >= 2, filledBy: null },
    { id: 6, label: 'Jogador Dinamarquês 🇩🇰', check: p => p.country === 'DK', filledBy: null },
    { id: 7, label: 'Entry Fragger', check: p => p.role === 'entry', filledBy: null },

    { id: 8, label: 'Lurker Lendário', check: p => p.role === 'lurker', filledBy: null },
    { id: 9, label: 'Lenda do CS2', check: p => p.eraGroup === 'CS2', filledBy: null },
    { id: 10, label: 'Rating 1.20+', check: p => p.stats.rating >= 1.20, filledBy: null },
    { id: 11, label: 'Lenda Sueca 🇸🇪', check: p => p.country === 'SE', filledBy: null },

    { id: 12, label: 'Jogador Suporte', check: p => p.role === 'support', filledBy: null },
    { id: 13, label: 'Jogador da Ucrânia 🇺🇦', check: p => p.country === 'UA', filledBy: null },
    { id: 14, label: 'OVR 90-94', check: p => p.ovr >= 90 && p.ovr <= 94, filledBy: null },
    { id: 15, label: 'HS% acima de 50%', check: p => p.stats.hsPercentage >= 50, filledBy: null },
  ];

  const [squares, setSquares] = useState<BingoSquare[]>(initialSquares);
  const [deck, setDeck] = useState<Player[]>(() => {
    return [...ALL_PLAYERS].sort(() => Math.random() - 0.5);
  });
  const [currentDrawn, setCurrentDrawn] = useState<Player | null>(null);
  const [isBingoWon, setIsBingoWon] = useState(false);

  // Draw card from deck
  const handleDrawNext = () => {
    if (deck.length === 0) return;
    sound.playCardReveal();
    const nextPlayer = deck[0];
    setCurrentDrawn(nextPlayer);
    setDeck(prev => prev.slice(1));
  };

  // Burn / skip current player
  const handleBurnPlayer = () => {
    sound.playClick();
    setCurrentDrawn(null);
    if (deck.length > 0) {
      handleDrawNext();
    }
  };

  // Place player into square if condition met
  const handlePlacePlayer = (squareId: number) => {
    if (!currentDrawn) return;
    const sq = squares[squareId];
    if (sq.filledBy) return;

    if (!sq.check(currentDrawn)) {
      sound.playRoundLoss();
      return;
    }

    sound.playRoundWin();
    const updated = squares.map(s => s.id === squareId ? { ...s, filledBy: currentDrawn } : s);
    setSquares(updated);
    setCurrentDrawn(null);

    // Check bingo (row, col, or diagonal)
    if (checkBingo(updated)) {
      setIsBingoWon(true);
      sound.playVictoryFanfare();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    } else if (deck.length > 0) {
      handleDrawNext();
    }
  };

  const checkBingo = (grid: BingoSquare[]): boolean => {
    // Rows
    for (let r = 0; r < 4; r++) {
      if (grid[r*4].filledBy && grid[r*4+1].filledBy && grid[r*4+2].filledBy && grid[r*4+3].filledBy) return true;
    }
    // Cols
    for (let c = 0; c < 4; c++) {
      if (grid[c].filledBy && grid[c+4].filledBy && grid[c+8].filledBy && grid[c+12].filledBy) return true;
    }
    // Diagonals
    if (grid[0].filledBy && grid[5].filledBy && grid[10].filledBy && grid[15].filledBy) return true;
    if (grid[3].filledBy && grid[6].filledBy && grid[9].filledBy && grid[12].filledBy) return true;
    return false;
  };

  const handleReset = () => {
    sound.playClick();
    setSquares(initialSquares);
    const newDeck = [...ALL_PLAYERS].sort(() => Math.random() - 0.5);
    setDeck(newDeck);
    setCurrentDrawn(null);
    setIsBingoWon(false);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-cs-border text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
          <span>CS Bingo 4x4</span>
        </div>
        <h2 className="font-display font-black text-3xl text-white uppercase tracking-wide">
          {t('bingo.title')}
        </h2>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          {t('bingo.desc')}
        </p>

        <div className="pt-2 flex items-center justify-center gap-4">
          <span className="text-xs font-mono font-bold text-slate-300 px-3 py-1 rounded-full bg-cs-surface border border-cs-border">
            {t('bingo.cardsLeft')}: {deck.length}
          </span>
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('bingo.reset')}
          </button>
        </div>
      </div>

      {/* Bingo Win Banner */}
      {isBingoWon && (
        <div className="p-6 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-center space-y-3">
          <h3 className="font-display font-black text-3xl text-white uppercase flex items-center justify-center gap-2">
            <Flame className="w-7 h-7 text-amber-400" />
            {t('bingo.winMessage')}
          </h3>
          <p className="text-slate-200 text-sm">
            Você completou uma linha/coluna ou diagonal com maestria tática!
          </p>
        </div>
      )}

      {/* Grid and Card Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 4x4 Bingo Grid */}
        <div className="lg:col-span-2 grid grid-cols-4 gap-2.5">
          {squares.map(sq => {
            const isValidForCurrent = currentDrawn && !sq.filledBy && sq.check(currentDrawn);

            return (
              <button
                key={sq.id}
                disabled={!isValidForCurrent && !sq.filledBy}
                onClick={() => handlePlacePlayer(sq.id)}
                className={`
                  h-28 p-2 rounded-xl border text-center transition-all flex flex-col justify-between
                  ${sq.filledBy 
                    ? 'bg-emerald-500/20 border-emerald-500/60' 
                    : isValidForCurrent 
                      ? 'bg-amber-500/20 border-amber-400 animate-pulse cursor-pointer' 
                      : 'bg-cs-surface/60 border-cs-border opacity-70'}
                `}
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  #{sq.id + 1}
                </span>

                {sq.filledBy ? (
                  <div className="space-y-0.5">
                    <span className="font-display font-black text-sm text-emerald-300 block truncate">
                      {sq.filledBy.nickname}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                      OVR {sq.filledBy.ovr}
                    </span>
                  </div>
                ) : (
                  <span className="font-display font-bold text-xs text-white leading-tight">
                    {sq.label}
                  </span>
                )}

                <div className="h-4 flex items-center justify-center">
                  {sq.filledBy && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawn Player Drawer Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-cs-border flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Jogador da Vez
          </span>

          {currentDrawn ? (
            <div className="w-full space-y-4">
              <PlayerCard player={currentDrawn} showOvr={true} size="md" />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBurnPlayer}
                  className="w-full py-2.5 rounded-xl bg-cs-surface hover:bg-cs-card border border-cs-border text-xs font-bold text-red-400 uppercase tracking-wider transition-colors"
                >
                  {t('bingo.burnPlayer')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-cs-surface border border-cs-border flex items-center justify-center mx-auto text-cs-muted">
                <Grid className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Clique para sacar uma carta lendária e encaixar na cartela.
              </p>
              <button
                disabled={deck.length === 0}
                onClick={handleDrawNext}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto shadow-lg hover:scale-105 transition-all"
              >
                <span>{t('bingo.drawCard')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
