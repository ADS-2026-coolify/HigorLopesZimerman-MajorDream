/* Hallmark · redesign: full · keep bingo logic, deck, cards, win check · esports dark tokens */
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
    { id: 0, label: 'Lenda brasileira 🇧🇷', check: p => p.country === 'BR', filledBy: null },
    { id: 1, label: 'OVR 95+ (estrela)', check: p => p.ovr >= 95, filledBy: null },
    { id: 2, label: 'AWPer de ofício', check: p => p.role === 'awp', filledBy: null },
    { id: 3, label: 'Era 2013-2016', check: p => p.eraGroup === '2013-2016', filledBy: null },

    { id: 4, label: 'Capitão / IGL', check: p => p.role === 'igl', filledBy: null },
    { id: 5, label: 'Mais de 2 Majors', check: p => (p.stats.majorsWon || 0) >= 2, filledBy: null },
    { id: 6, label: 'Jogador dinamarquês 🇩🇰', check: p => p.country === 'DK', filledBy: null },
    { id: 7, label: 'Entry Fragger', check: p => p.role === 'entry', filledBy: null },

    { id: 8, label: 'Lurker lendário', check: p => p.role === 'lurker', filledBy: null },
    { id: 9, label: 'Lenda do CS2', check: p => p.eraGroup === 'CS2', filledBy: null },
    { id: 10, label: 'Rating 1.20+', check: p => p.stats.rating >= 1.20, filledBy: null },
    { id: 11, label: 'Lenda sueca 🇸🇪', check: p => p.country === 'SE', filledBy: null },

    { id: 12, label: 'Jogador suporte', check: p => p.role === 'support', filledBy: null },
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
      <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border text-center space-y-3">
        <h2 className="font-display font-black text-3xl text-white">
          {t('bingo.title')}
        </h2>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cs-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-cs-accent" />
          <span>CS Bingo 4x4</span>
        </div>

        <p className="text-cs-muted text-sm max-w-md mx-auto">
          {t('bingo.desc')}
        </p>

        <div className="pt-2 flex items-center justify-center gap-4">
          <span className="text-xs font-mono font-bold text-cs-text px-3 py-1 rounded-full bg-cs-card border border-cs-border">
            {t('bingo.cardsLeft')}: {deck.length}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-cs-muted hover:text-white active:brightness-95 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('bingo.reset')}</span>
          </button>
        </div>
      </div>

      {/* Bingo Win Banner */}
      {isBingoWon && (
        <div className="p-6 rounded-2xl bg-cs-accent/20 border border-cs-accent text-center space-y-2">
          <h3 className="font-display font-black text-2xl text-white flex items-center justify-center gap-2">
            <Flame className="w-6 h-6 text-cs-accent" />
            <span>{t('bingo.winMessage')}</span>
          </h3>
          <p className="text-cs-text text-sm">
            Você completou uma linha, coluna ou diagonal com maestria tática!
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
                type="button"
                disabled={!isValidForCurrent && !sq.filledBy}
                onClick={() => handlePlacePlayer(sq.id)}
                className={`
                  h-28 p-2 rounded-xl border text-center transition-colors flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none disabled:cursor-not-allowed
                  ${sq.filledBy 
                    ? 'bg-cs-green/15 border-cs-green/60' 
                    : isValidForCurrent 
                      ? 'bg-cs-accent/20 border-cs-accent motion-safe:animate-pulse motion-reduce:animate-none cursor-pointer' 
                      : 'bg-cs-card border-cs-border opacity-65'}
                `}
              >
                <span className="text-[10px] font-semibold text-cs-muted">
                  #{sq.id + 1}
                </span>

                {sq.filledBy ? (
                  <div className="space-y-0.5">
                    <span className="font-display font-bold text-sm text-cs-green block truncate">
                      {sq.filledBy.nickname}
                    </span>
                    <span className="text-[10px] font-semibold text-cs-green block">
                      OVR {sq.filledBy.ovr}
                    </span>
                  </div>
                ) : (
                  <span className="font-display font-bold text-xs text-white leading-tight">
                    {sq.label}
                  </span>
                )}

                <div className="h-4 flex items-center justify-center">
                  {sq.filledBy && <Check className="w-3.5 h-3.5 text-cs-green" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawn Player Drawer Panel */}
        <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-semibold text-cs-muted">
            Jogador da vez
          </span>

          {currentDrawn ? (
            <div className="w-full space-y-4">
              <PlayerCard player={currentDrawn} showOvr={true} size="md" />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBurnPlayer}
                  className="w-full py-2.5 rounded-xl bg-cs-card hover:bg-cs-hover active:brightness-95 border border-cs-border text-xs font-semibold text-cs-red transition-colors focus-visible:ring-2 focus-visible:ring-cs-red focus-visible:outline-none"
                >
                  {t('bingo.burnPlayer')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-cs-card border border-cs-border flex items-center justify-center mx-auto text-cs-muted">
                <Grid className="w-7 h-7" />
              </div>
              <p className="text-xs text-cs-muted max-w-[200px]">
                Clique para sacar uma carta lendária e encaixar na cartela.
              </p>
              <button
                type="button"
                disabled={deck.length === 0}
                onClick={handleDrawNext}
                className="px-6 py-3 rounded-xl bg-cs-accent hover:bg-cs-accentHover active:brightness-95 disabled:opacity-50 disabled:pointer-events-none text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-cs-accent focus-visible:outline-none"
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
