import React, { useState } from 'react';
import { I18nProvider } from './i18n/I18nContext';
import { Navbar, NavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { DraftFlow } from './components/DraftFlow';
import { MapAdvantage } from './components/MapAdvantage';
import { SimulationCampaign } from './components/SimulationCampaign';
import { GuessProGame } from './components/GuessProGame';
import { CSBingoGame } from './components/CSBingoGame';
import { HistoryStats } from './components/HistoryStats';
import { CampaignState, Player } from './types';
import { calculateTeamOvr, calculateSynergy } from './utils/simulationEngine';
import { resetDraftMapSession } from './utils/mapProficiency';

const ACTIVE_CAMPAIGN_KEY = 'draftarena_active_campaign_v2';

function recoverSavedCampaign(): CampaignState | null {
  try {
    const saved = localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.campaignId && Array.isArray(parsed.lineup) && parsed.lineup.length === 5) {
        return parsed;
      }
    }

    // Fallback: recover the latest saved Major tournament from localStorage (`draftarena_major_v2_*`)
    let latestMajor: any = null;
    let latestTimestamp = -1;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('draftarena_major_v2_')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsedMajor = JSON.parse(raw);
        if (parsedMajor && parsedMajor.tournamentId && parsedMajor.userTeamBase?.roster?.length === 5) {
          const ts = Number(String(parsedMajor.tournamentId).replace('camp_', '')) || 0;
          if (ts > latestTimestamp) {
            latestTimestamp = ts;
            latestMajor = parsedMajor;
          }
        }
      }
    }

    if (latestMajor) {
      const uBase = latestMajor.userTeamBase;
      const activeStage =
        latestMajor.activeStageId !== 'playoffs'
          ? latestMajor.stages?.[latestMajor.activeStageId]
          : latestMajor.stages?.stage3;
      const uInStage = activeStage?.teams?.find((t: any) => t.id === 'user-team');
      const recovered: CampaignState = {
        campaignId: latestMajor.tournamentId,
        teamName: uBase.name || 'Meu Time',
        lineup: uBase.roster,
        overallOvr: uBase.ovr || calculateTeamOvr(uBase.roster),
        synergy: calculateSynergy(uBase.roster),
        mapPoints: {},
        baseProficiencies: uBase.mapProficiencies,
        swissRound: activeStage?.currentRound || 1,
        userWins: uInStage?.wins ?? 0,
        userLosses: uInStage?.losses ?? 0,
        swissMatches: [],
        isSwissFinished: latestMajor.activeStageId === 'playoffs' || latestMajor.machineState === 'tournament_complete',
        isQualifiedForPlayoffs: !!latestMajor.playoffs?.seededTeams?.some((t: any) => t.id === 'user-team'),
        playoffStage: 'none',
        playoffMatches: [],
        isChampion: latestMajor.champion?.id === 'user-team',
        isInvictus: false,
        majorMvp: null,
        status: latestMajor.machineState === 'tournament_complete' ? 'completed' : 'swiss'
      };
      localStorage.setItem(ACTIVE_CAMPAIGN_KEY, JSON.stringify(recovered));
      return recovered;
    }
  } catch (e) {
    console.error('Failed to restore active campaign', e);
  }
  return null;
}

export const AppContent: React.FC = () => {
  // Restore active campaign on page load/HMR if one is in progress
  const [activeCampaign, setActiveCampaign] = useState<CampaignState | null>(() => recoverSavedCampaign());

  const [currentTab, setCurrentTab] = useState<NavTab>(() => (activeCampaign ? 'draft' : 'home'));
  const [campaignHistory, setCampaignHistory] = useState<CampaignState[]>([]);

  // Persist active campaign so refreshes or HMR never lose tournament progress
  React.useEffect(() => {
    if (activeCampaign) {
      localStorage.setItem(ACTIVE_CAMPAIGN_KEY, JSON.stringify(activeCampaign));
    } else {
      localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    }
  }, [activeCampaign]);

  const clearSavedMajors = () => {
    localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('draftarena_major_v2_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  };

  // Start new draft
  const handleStartDraft = () => {
    resetDraftMapSession();
    clearSavedMajors();
    setActiveCampaign(null);
    setCurrentTab('draft');
  };

  // Called when 5 players chosen in draft and complete summary confirmed
  const handleDraftComplete = (
    lineup: Player[],
    teamName: string,
    mapPoints: Record<string, number> = {},
    baseProficiencies?: Record<string, number>
  ) => {
    const teamOvr = calculateTeamOvr(lineup);
    const synergy = calculateSynergy(lineup);

    const newCampaign: CampaignState = {
      campaignId: `camp_${Date.now()}`,
      teamName: teamName || 'Meu Time',
      lineup,
      overallOvr: teamOvr,
      synergy,
      mapPoints,
      baseProficiencies,
      swissRound: 1,
      userWins: 0,
      userLosses: 0,
      swissMatches: [],
      isSwissFinished: false,
      isQualifiedForPlayoffs: false,
      playoffStage: 'none',
      playoffMatches: [],
      isChampion: false,
      isInvictus: false,
      majorMvp: null,
      status: 'swiss'
    };

    setActiveCampaign(newCampaign);
  };

  // Called when tactical map points confirmed
  const handleMapPointsConfirm = (points: Record<string, number>, baseProficiencies?: Record<string, number>) => {
    if (!activeCampaign) return;
    const updated: CampaignState = {
      ...activeCampaign,
      mapPoints: points,
      baseProficiencies: baseProficiencies || activeCampaign.baseProficiencies,
      status: 'swiss'
    };
    setActiveCampaign(updated);
  };

  // Update campaign as matches are played
  const handleUpdateCampaign = (updated: CampaignState) => {
    setActiveCampaign(updated);
    if (updated.status === 'completed') {
      setCampaignHistory(prev => [updated, ...prev]);
    }
  };

  // Restart campaign
  const handleRestartCampaign = () => {
    resetDraftMapSession();
    clearSavedMajors();
    setActiveCampaign(null);
    setCurrentTab('draft');
  };

  return (
    <div className="min-h-screen bg-cs-bg text-cs-text flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-6 pb-12">
        {currentTab === 'home' && (
          <HomeView
            onStartDraft={handleStartDraft}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'draft' && (
          <>
            {!activeCampaign && (
              <DraftFlow
                onCompleteDraft={handleDraftComplete}
                onCancel={() => setCurrentTab('home')}
              />
            )}

            {activeCampaign && activeCampaign.status === 'map_allocation' && (
              <MapAdvantage
                onConfirm={handleMapPointsConfirm}
                onBack={() => setActiveCampaign(null)}
              />
            )}

            {activeCampaign && (activeCampaign.status === 'swiss' || activeCampaign.status === 'playoffs' || activeCampaign.status === 'completed') && (
              <SimulationCampaign
                campaign={activeCampaign}
                onUpdateCampaign={handleUpdateCampaign}
                onRestart={handleRestartCampaign}
              />
            )}
          </>
        )}

        {currentTab === 'guess' && <GuessProGame />}
        {currentTab === 'bingo' && <CSBingoGame />}
        {currentTab === 'history' && <HistoryStats savedCampaigns={campaignHistory} />}
      </main>

      <footer className="border-t border-cs-border/60 py-6 text-center text-xs text-cs-muted bg-cs-surface/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Draft Arena. Projeto inspirado em 12a0.com. Todos os dados históricos de Counter-Strike são de uso esportivo/educativo.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>MR12 Simulation Engine</span>
            <span>·</span>
            <span>pt-BR / EN</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
