/* Hallmark · redesign: full · keep Swiss bracket structure and record slots · semantic tokens */
import React from 'react';
import { TournamentTeam } from '../types/tournament';
import { TeamLogo } from './TeamLogo';

interface SwissStandingsProps {
  teams: TournamentTeam[];
  highlightTeamId?: string;
}

export const SwissStandings: React.FC<SwissStandingsProps> = ({
  teams,
  highlightTeamId = 'user-team'
}) => {
  // Helper to filter teams by exact record
  const getTeamsByRecord = (wins: number, losses: number) => {
    return teams.filter(t => t.wins === wins && t.losses === losses);
  };

  const renderTeamSlot = (team?: TournamentTeam) => {
    if (!team) {
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-dashed border-cs-border bg-cs-bg/60 flex items-center justify-center shrink-0" />
      );
    }

    const isUser = team.id === highlightTeamId;

    return (
      <div
        key={team.id}
        title={`${team.name} (${team.wins}-${team.losses})`}
        className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors p-0.5 shrink-0 ${
          isUser
            ? 'ring-2 ring-cs-green shadow-md z-10'
            : 'border border-cs-border hover:border-cs-accent'
        }`}
      >
        <TeamLogo
          teamId={team.id}
          name={team.name}
          logoText={team.logoText}
          accentColor={team.accentColor}
          size="sm"
          className="w-full h-full rounded-full"
        />
      </div>
    );
  };

  const renderRecordBox = (
    wins: number,
    losses: number,
    maxSlots: number,
    boxType: 'normal' | 'qualified' | 'eliminated' = 'normal'
  ) => {
    const matchingTeams = getTeamsByRecord(wins, losses);
    const slots = [];
    for (let i = 0; i < maxSlots; i++) {
      slots.push(matchingTeams[i]);
    }

    let bgStyle = 'bg-cs-card border-cs-border';
    let headerStyle = 'text-cs-text';

    if (boxType === 'qualified') {
      bgStyle = 'bg-cs-green/15 border-cs-green/30';
      headerStyle = 'text-cs-green font-bold';
    } else if (boxType === 'eliminated') {
      bgStyle = 'bg-cs-red/15 border-cs-red/30';
      headerStyle = 'text-cs-red font-bold';
    }

    return (
      <div className={`rounded-xl border p-2 flex flex-col items-center justify-center min-w-[76px] sm:min-w-[88px] ${bgStyle}`}>
        <span className={`text-[11px] font-mono mb-1.5 ${headerStyle}`}>
          {wins}-{losses}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[130px]">
          {slots.map((t, idx) => (
            <React.Fragment key={t ? t.id : `empty_${wins}_${losses}_${idx}`}>
              {renderTeamSlot(t)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-cs-surface border border-cs-border rounded-2xl p-4 sm:p-5 text-white shadow-sm overflow-x-auto">
      <div className="min-w-[700px] flex items-start justify-between gap-3 text-center">
        {/* Column 0: Início (0-0) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-cs-muted">Início</span>
          {renderRecordBox(0, 0, 16, 'normal')}
        </div>

        {/* Column 1: 1 jogo (1-0, 0-1) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-cs-muted">1 jogo</span>
          <div className="flex flex-col gap-2 w-full">
            {renderRecordBox(1, 0, 8, 'normal')}
            {renderRecordBox(0, 1, 8, 'normal')}
          </div>
        </div>

        {/* Column 2: 2 jogos (2-0, 1-1, 0-2) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-cs-muted">2 jogos</span>
          <div className="flex flex-col gap-2 w-full">
            {renderRecordBox(2, 0, 4, 'normal')}
            {renderRecordBox(1, 1, 8, 'normal')}
            {renderRecordBox(0, 2, 4, 'normal')}
          </div>
        </div>

        {/* Column 3: 3 jogos (3-0 [QUAL], 2-1, 1-2, 0-3 [ELIM]) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-cs-muted">3 jogos</span>
          <div className="flex flex-col gap-2 w-full">
            {renderRecordBox(3, 0, 2, 'qualified')}
            {renderRecordBox(2, 1, 6, 'normal')}
            {renderRecordBox(1, 2, 6, 'normal')}
            {renderRecordBox(0, 3, 2, 'eliminated')}
          </div>
        </div>

        {/* Column 4: 4 jogos (3-1 [QUAL], 2-2, 1-3 [ELIM]) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-cs-muted">4 jogos</span>
          <div className="flex flex-col gap-2 w-full">
            {renderRecordBox(3, 1, 3, 'qualified')}
            {renderRecordBox(2, 2, 6, 'normal')}
            {renderRecordBox(1, 3, 3, 'eliminated')}
          </div>
        </div>

        {/* Column 5: 5 jogos (3-2 [QUAL], 2-3 [ELIM]) */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-cs-muted">5 jogos</span>
          <div className="flex flex-col gap-2 w-full">
            {renderRecordBox(3, 2, 3, 'qualified')}
            {renderRecordBox(2, 3, 3, 'eliminated')}
          </div>
        </div>
      </div>
    </div>
  );
};
