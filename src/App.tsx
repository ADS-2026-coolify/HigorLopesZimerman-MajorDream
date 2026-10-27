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

export const AppContent: React.FC = () => {
  // Fresh state on every page load/refresh (just like 12a0.com)
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeCampaign, setActiveCampaign] = useState<CampaignState | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<CampaignState[]>([]);

  // Clear any existing stored campaign from localStorage to guarantee fresh start
  React.useEffect(() => {
    localStorage.removeItem('draftarena_active_campaign');
  }, []);

  // Start new draft
  const handleStartDraft = () => {
    setActiveCampaign(null);
    setCurrentTab('draft');
  };

  // Called when 5 players chosen in draft and complete summary confirmed
  const handleDraftComplete = (lineup: Player[], teamName: string, mapPoints: Record<string, number> = {}) => {
    const teamOvr = calculateTeamOvr(lineup);
    const synergy = calculateSynergy(lineup);

    const newCampaign: CampaignState = {
      campaignId: `camp_${Date.now()}`,
      teamName: teamName || 'Meu Time',
      lineup,
      overallOvr: teamOvr,
      synergy,
      mapPoints,
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
  const handleMapPointsConfirm = (points: Record<string, number>) => {
    if (!activeCampaign) return;
    const updated: CampaignState = {
      ...activeCampaign,
      mapPoints: points,
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
