/* Hallmark · redesign: full · keep guess logic, history, metrics, sound · esports dark tokens */
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
        <span className="flex items-center justify-center gap-1 bg-cs-green/15 text-cs-green border border-cs-green/40 p-2 rounded-lg font-mono font-bold text-xs">
          {userVal}{suffix} <Check className="w-3.5 h-3.5" />
        </span>
      );
    }
    const isHigher = userVal > targetVal;
    return (
      <span className="flex items-center justify-center gap-1 bg-cs-card text-cs-text border border-cs-border p-2 rounded-lg font-mono font-bold text-xs">
        {userVal}{suffix} {isHigher ? <ArrowDown className="w-3.5 h-3.5 text-cs-red" /> : <ArrowUp className="w-3.5 h-3.5 text-cs-green" />}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Game Header */}
      <div className="bg-cs-surface p-6 rounded-2xl border border-cs-border text-center space-y-3">
        <h2 className="font-display font-black text-3xl text-white">
          {t('guess.title')}
        </h2>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cs-blue">
          <span className="w-1.5 h-1.5 rounded-full bg-cs-blue" />
          <span>CS Guessr Pro</span>
        </div>

        <p className="text-cs-muted text-sm max-w-md mx-auto">
          {t('guess.desc')}
        </p>

        <div className="pt-2">
          <span className="text-xs font-mono font-bold text-cs-accent px-3 py-1 rounded-full bg-cs-card border border-cs-border">
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
            className="w-full px-5 py-3.5 rounded-xl bg-cs-surface border border-cs-border text-white placeholder:text-cs-muted focus:border-cs-blue focus:ring-2 focus:ring-cs-blue focus:outline-none transition-colors shadow-lg text-sm"
          />

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-cs-card border border-cs-border overflow-hidden z-20">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  disabled={isGameOver}
                  onClick={() => handleMakeGuess(p)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-cs-surface active:bg-cs-surface/80 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-between border-b border-cs-border/40 last:border-0 transition-colors focus-visible:ring-2 focus-visible:ring-cs-blue focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.nickname}</span>
                    <span className="text-xs text-cs-muted">({p.realName})</span>
                  </div>
                  <span className="text-xs font-mono text-cs-accent">{p.teamName}, {p.era}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Win/Loss Modal Card */}
      {isGameOver && (
        <div className={`p-6 rounded-2xl border text-center space-y-4 max-w-md mx-auto ${
          isWon ? 'bg-cs-green/10 border-cs-green' : 'bg-cs-red/10 border-cs-red'
        }`}>
          <h3 className="font-display font-black text-2xl text-white">
            {isWon ? t('guess.wonMessage') : `${t('guess.lostMessage')} ${targetPlayer.nickname}!`}
          </h3>
          <p className="text-xs text-cs-muted">
            {targetPlayer.realName}, {targetPlayer.teamName} ({targetPlayer.era}), OVR {targetPlayer.ovr}
          </p>
          <button
            type="button"
            disabled={!isGameOver}
            onClick={handleRestart}
            className="px-6 py-2.5 rounded-xl bg-cs-blue hover:bg-sky-400 active:brightness-95 disabled:opacity-50 disabled:pointer-events-none text-black font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-cs-blue focus-visible:outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jogar novamente</span>
          </button>
        </div>
      )}

      {/* Guesses Table */}
      {guesses.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-cs-muted text-center px-2">
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
                  <div className={`p-2 rounded-lg font-bold truncate flex items-center justify-center border ${
                    isNicknameMatch ? 'bg-cs-green/15 text-cs-green border-cs-green/40' : 'bg-cs-card text-white border-cs-border'
                  }`}>
                    {g.nickname}
                  </div>

                  {/* Team */}
                  <div className={`p-2 rounded-lg font-medium truncate flex items-center justify-center border ${
                    isTeamMatch ? 'bg-cs-green/15 text-cs-green border-cs-green/40' : 'bg-cs-card text-cs-muted border-cs-border'
                  }`}>
                    {g.teamName}
                  </div>

                  {/* Country */}
                  <div className={`p-2 rounded-lg font-bold flex items-center justify-center border ${
                    isCountryMatch ? 'bg-cs-green/15 text-cs-green border-cs-green/40' : 'bg-cs-card text-cs-muted border-cs-border'
                  }`}>
                    {g.country}
                  </div>

                  {/* Role */}
                  <div className={`p-2 rounded-lg font-semibold flex items-center justify-center border ${
                    isRoleMatch ? 'bg-cs-green/15 text-cs-green border-cs-green/40' : 'bg-cs-card text-cs-muted border-cs-border'
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
