import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Player } from '../types';
import { ALL_PLAYERS } from '../data/csData';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { Check, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

export const GuessProGame: React.FC = () => {
  const { t } = useI18n();

  // Deterministic daily player based on day timestamp
  const [targetPlayer, setTargetPlayer] = useState<Player>(() => {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash << 5) - hash + today.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % ALL_PLAYERS.length;
    return ALL_PLAYERS[idx];
  });

  const [query, setQuery] = useState('');
  const [guesses, setGuesses] = useState<Player[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const MAX_ATTEMPTS = 6;

  // Filter player suggestions
  const suggestions = query.trim().length > 0
    ? ALL_PLAYERS.filter(p => 
        p.nickname.toLowerCase().includes(query.toLowerCase()) &&
        !guesses.some(g => g.id === p.id)
      ).slice(0, 6)
    : [];

  const handleMakeGuess = (player: Player) => {
    sound.playClick();
    const updated = [player, ...guesses];
    setGuesses(updated);
    setQuery('');

    if (player.nickname.toLowerCase() === targetPlayer.nickname.toLowerCase()) {
      setIsWon(true);
      setIsGameOver(true);
      sound.playVictoryFanfare();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else if (updated.length >= MAX_ATTEMPTS) {
      setIsGameOver(true);
      sound.playRoundLoss();
    }
  };

  const handleRestart = () => {
    sound.playClick();
    const randomPlayer = ALL_PLAYERS[Math.floor(Math.random() * ALL_PLAYERS.length)];
    setTargetPlayer(randomPlayer);
    setGuesses([]);
    setIsWon(false);
    setIsGameOver(false);
    setQuery('');
  };

  // Metric comparator helper
  const renderCompare = (userVal: number, targetVal: number, suffix = '') => {
    if (userVal === targetVal) {
      return (
        <span className="flex items-center justify-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 p-2 rounded-lg font-mono font-bold">
          {userVal}{suffix} <Check className="w-3.5 h-3.5" />
        </span>
      );
    }
    const isHigher = userVal > targetVal;
    return (
      <span className="flex items-center justify-center gap-1 bg-cs-surface text-slate-300 border border-cs-border p-2 rounded-lg font-mono font-bold">
        {userVal}{suffix} {isHigher ? <ArrowDown className="w-3.5 h-3.5 text-red-400" /> : <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Game Header */}
      <div className="glass-panel p-6 rounded-2xl border border-cs-border text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
          <span>CS Guessr Pro</span>
        </div>
        <h2 className="font-display font-black text-3xl text-white uppercase tracking-wide">
          {t('guess.title')}
        </h2>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          {t('guess.desc')}
        </p>

        <div className="pt-2">
          <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 rounded-full bg-cs-surface border border-cs-border">
            {t('guess.attemptsLeft')}: {MAX_ATTEMPTS - guesses.length} / {MAX_ATTEMPTS}
          </span>
        </div>
      </div>

      {/* Input / Search Box */}
      {!isGameOver && (
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('guess.inputPlaceholder')}
            className="w-full px-5 py-3.5 rounded-xl bg-cs-surface border border-cs-border text-white placeholder:text-cs-muted focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 shadow-lg text-sm"
          />

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-cs-card border border-cs-border shadow-2xl overflow-hidden z-20">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleMakeGuess(p)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-cs-surface flex items-center justify-between border-b border-cs-border/40 last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.nickname}</span>
                    <span className="text-xs text-cs-muted">({p.realName})</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400">{p.teamName} · {p.era}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Win/Loss Modal Card */}
      {isGameOver && (
        <div className={`p-6 rounded-2xl border-2 text-center space-y-4 max-w-md mx-auto ${
          isWon ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'
        }`}>
          <h3 className="font-display font-black text-2xl text-white uppercase">
            {isWon ? t('guess.wonMessage') : `${t('guess.lostMessage')} ${targetPlayer.nickname}!`}
          </h3>
          <p className="text-xs text-slate-300">
            {targetPlayer.realName} · {targetPlayer.teamName} ({targetPlayer.era}) · OVR {targetPlayer.ovr}
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jogar Novamente</span>
          </button>
        </div>
      )}

      {/* Guesses Table */}
      {guesses.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2 text-[11px] font-mono font-bold text-slate-400 uppercase text-center px-2">
            <div>{t('guess.colPlayer')}</div>
            <div>{t('guess.colTeam')}</div>
            <div>{t('guess.colCountry')}</div>
            <div>{t('guess.colRole')}</div>
            <div>{t('guess.colEra')}</div>
            <div>{t('guess.colOvr')}</div>
          </div>

          <div className="space-y-2">
            {guesses.map((g, idx) => {
              const isNicknameMatch = g.nickname.toLowerCase() === targetPlayer.nickname.toLowerCase();
              const isTeamMatch = g.teamName.toLowerCase() === targetPlayer.teamName.toLowerCase();
              const isCountryMatch = g.country.toLowerCase() === targetPlayer.country.toLowerCase();
              const isRoleMatch = g.role.toLowerCase() === targetPlayer.role.toLowerCase();

              return (
                <div key={idx} className="grid grid-cols-6 gap-2 text-xs text-center">
                  {/* Player */}
                  <div className={`p-2 rounded-lg font-bold truncate flex items-center justify-center ${
                    isNicknameMatch ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-cs-surface text-white border border-cs-border'
                  }`}>
                    {g.nickname}
                  </div>

                  {/* Team */}
                  <div className={`p-2 rounded-lg font-medium truncate flex items-center justify-center ${
                    isTeamMatch ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-cs-surface text-slate-300 border border-cs-border'
                  }`}>
                    {g.teamName}
                  </div>

                  {/* Country */}
                  <div className={`p-2 rounded-lg font-bold flex items-center justify-center ${
                    isCountryMatch ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-cs-surface text-slate-300 border border-cs-border'
                  }`}>
                    {g.country}
                  </div>

                  {/* Role */}
                  <div className={`p-2 rounded-lg font-semibold uppercase flex items-center justify-center ${
                    isRoleMatch ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-cs-surface text-slate-300 border border-cs-border'
                  }`}>
                    {g.role}
                  </div>

                  {/* Era */}
                  <div>
                    {renderCompare(parseInt(g.era) || 2020, parseInt(targetPlayer.era) || 2020)}
                  </div>

                  {/* OVR */}
                  <div>
                    {renderCompare(g.ovr, targetPlayer.ovr)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
