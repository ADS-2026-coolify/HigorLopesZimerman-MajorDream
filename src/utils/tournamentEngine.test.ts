import { describe, it, expect } from 'vitest';
import {
  initialize16Teams,
  generateSwissPairings,
  getMatchFormat,
  computeCpuVetoChoice,
  updateTournamentStandings,
  evaluateMatchStatus,
  getTeamSides,
  simulateCompetitiveMap,
  simulateCpuVsCpuMatch,
  transitionVetoState,
  getExpectedVetoStep,
  TOURNAMENT_MAPS,
  initializeMajorTournament,
  simulateSwissStageToCompletion,
  completeCurrentSwissStage,
  advanceToNextMajorStage,
  recordPlayoffMatchResult
} from './tournamentEngine';
import { MapVetoState } from '../types/tournament';

describe('Tournament Engine Tests', () => {
  const dummyLineup = [
    { id: 'p1', nickname: 'Cold', realName: 'M', country: 'BR', countryName: 'Brasil', role: 'lurker', ovr: 95, era: '2016', eraGroup: '2013-2016', teamId: 't1', teamName: 'LG', stats: { rating: 1.2, impact: 1.2, adr: 80, hsPercentage: 50 } },
    { id: 'p2', nickname: 'FalleN', realName: 'G', country: 'BR', countryName: 'Brasil', role: 'igl', ovr: 92, era: '2016', eraGroup: '2013-2016', teamId: 't1', teamName: 'LG', stats: { rating: 1.1, impact: 1.1, adr: 75, hsPercentage: 40 } },
    { id: 'p3', nickname: 'fer', realName: 'F', country: 'BR', countryName: 'Brasil', role: 'entry', ovr: 90, era: '2016', eraGroup: '2013-2016', teamId: 't1', teamName: 'LG', stats: { rating: 1.1, impact: 1.2, adr: 82, hsPercentage: 45 } },
    { id: 'p4', nickname: 'fnx', realName: 'L', country: 'BR', countryName: 'Brasil', role: 'rifler', ovr: 88, era: '2016', eraGroup: '2013-2016', teamId: 't1', teamName: 'LG', stats: { rating: 1.0, impact: 1.0, adr: 72, hsPercentage: 45 } },
    { id: 'p5', nickname: 'TACO', realName: 'E', country: 'BR', countryName: 'Brasil', role: 'support', ovr: 84, era: '2016', eraGroup: '2013-2016', teamId: 't1', teamName: 'LG', stats: { rating: 0.98, impact: 1.0, adr: 70, hsPercentage: 40 } }
  ] as any;

  it('initializes 16 teams with user team at 0-0', () => {
    const teams = initialize16Teams('FURIA TEST', dummyLineup, 90, { mirage: 5 });
    expect(teams).toHaveLength(16);
    expect(teams[0].isUser).toBe(true);
    expect(teams[0].name).toBe('FURIA TEST');
    expect(teams[0].wins).toBe(0);
    expect(teams[0].losses).toBe(0);
    expect(teams.every(t => t.wins === 0 && t.losses === 0)).toBe(true);
  });

  it('determines correct match formats according to Swiss record rules', () => {
    // BO1 records
    expect(getMatchFormat(0, 0)).toBe('BO1');
    expect(getMatchFormat(1, 0)).toBe('BO1');
    expect(getMatchFormat(0, 1)).toBe('BO1');
    expect(getMatchFormat(1, 1)).toBe('BO1');

    // BO3 records (advancement or elimination)
    expect(getMatchFormat(2, 0)).toBe('BO3');
    expect(getMatchFormat(0, 2)).toBe('BO3');
    expect(getMatchFormat(2, 1)).toBe('BO3');
    expect(getMatchFormat(1, 2)).toBe('BO3');
    expect(getMatchFormat(2, 2)).toBe('BO3');
  });

  it('generates 8 round-1 pairings with no team scheduled twice', () => {
    const teams = initialize16Teams('My Team', dummyLineup, 90, {});
    const pairings = generateSwissPairings(teams, [], 1, 12345);
    expect(pairings).toHaveLength(8);

    const scheduled = new Set<string>();
    pairings.forEach(p => {
      expect(scheduled.has(p.team1Id)).toBe(false);
      expect(scheduled.has(p.team2Id)).toBe(false);
      expect(p.team1Id).not.toBe(p.team2Id);
      scheduled.add(p.team1Id);
      scheduled.add(p.team2Id);
    });
    expect(scheduled.size).toBe(16);
  });

  it('CPU ban chooses the map where user advantage is greatest', () => {
    const cpuProf = { mirage: 50, dust2: 40, inferno: 70 };
    const userProf = { mirage: 80, dust2: 42, inferno: 65 }; // user +30 on mirage
    const banned = computeCpuVetoChoice('ban', ['mirage', 'dust2', 'inferno'], cpuProf, userProf);
    expect(banned).toBe('mirage');
  });

  it('CPU pick chooses the map where CPU advantage is greatest', () => {
    const cpuProf = { mirage: 50, dust2: 40, inferno: 70 };
    const userProf = { mirage: 80, dust2: 42, inferno: 60 }; // cpu +10 on inferno
    const picked = computeCpuVetoChoice('pick', ['mirage', 'dust2', 'inferno'], cpuProf, userProf);
    expect(picked).toBe('inferno');
  });

  it('updates standings, qualifying 3-win teams and eliminating 3-loss teams', () => {
    const teams = initialize16Teams('My Team', dummyLineup, 90, {});
    const completedMatches = [
      { id: 'm1', roundNumber: 1, team1Id: teams[0].id, team2Id: teams[1].id, format: 'BO1', status: 'completed', mapResults: [], winnerId: teams[0].id, loserId: teams[1].id },
      { id: 'm2', roundNumber: 2, team1Id: teams[0].id, team2Id: teams[2].id, format: 'BO1', status: 'completed', mapResults: [], winnerId: teams[0].id, loserId: teams[2].id },
      { id: 'm3', roundNumber: 3, team1Id: teams[0].id, team2Id: teams[3].id, format: 'BO3', status: 'completed', mapResults: [], winnerId: teams[0].id, loserId: teams[3].id },
    ] as any;

    const updated = updateTournamentStandings(teams, completedMatches);
    const user = updated.find(t => t.id === teams[0].id)!;
    expect(user.wins).toBe(3);
    expect(user.status).toBe('qualified');
  });

  // ==========================================
  // SECTION 1: OVERTIME RULES TESTS
  // ==========================================
  describe('Counter-Strike Overtime System', () => {
    it('1. Regulation ends 13-10 without overtime', () => {
      const res = evaluateMatchStatus(13, 10);
      expect(res.isFinished).toBe(true);
      expect(res.winner).toBe(1);
      expect(res.phase).toBe('regulation');
    });

    it('2. Regulation ends 12-12 and triggers overtime', () => {
      const res = evaluateMatchStatus(12, 12);
      expect(res.isFinished).toBe(false);
      expect(res.winner).toBe(null);
      expect(res.phase).toBe('regulation');
    });

    it('3. First overtime ends when target 16 is reached (e.g. 16-14)', () => {
      const ongoing = evaluateMatchStatus(15, 14);
      expect(ongoing.isFinished).toBe(false);
      expect(ongoing.targetScore).toBe(16);

      const finished = evaluateMatchStatus(16, 14);
      expect(finished.isFinished).toBe(true);
      expect(finished.winner).toBe(1);
      expect(finished.phase).toBe('overtime');
    });

    it('4. First overtime tied at 15-15 triggers second overtime', () => {
      const res = evaluateMatchStatus(15, 15);
      expect(res.isFinished).toBe(false);
      expect(res.winner).toBe(null);
      expect(res.targetScore).toBe(19);
    });

    it('5. Second overtime ends at 19-17 with target 19', () => {
      const res = evaluateMatchStatus(19, 17);
      expect(res.isFinished).toBe(true);
      expect(res.winner).toBe(1);
      expect(res.phase).toBe('overtime');
      expect(res.targetScore).toBe(19);
    });

    it('6. Multiple consecutive overtimes supported (3rd OT -> 22, 4th OT -> 25)', () => {
      expect(evaluateMatchStatus(18, 18).targetScore).toBe(22);
      expect(evaluateMatchStatus(22, 20).isFinished).toBe(true);
      expect(evaluateMatchStatus(21, 21).targetScore).toBe(25);
      expect(evaluateMatchStatus(23, 25).isFinished).toBe(true);
      expect(evaluateMatchStatus(23, 25).winner).toBe(2);
    });

    it('7. Matches never end in a draw in simulateCompetitiveMap', () => {
      const teams = initialize16Teams('T1', dummyLineup, 90, {});
      const team1 = teams[0];
      const team2 = teams[1];
      const mapRes = simulateCompetitiveMap('mirage', 'Mirage', team1, team2, 9999);
      expect(mapRes.winner).toMatch(/^(user|opponent)$/);
      expect(mapRes.userScore).not.toBe(mapRes.opponentScore);
    });

    it('8. Immediate termination: no extra rounds simulated once target reached (deterministic)', () => {
      const teams = initialize16Teams('T1', dummyLineup, 90, {});
      // Create a deterministic sequence for 16-12 (T1 wins 12 rounds, T2 wins 12 rounds, then T1 wins 4 in a row to reach 16)
      // 12 for T1, 12 for T2 (total 24 -> 12-12)
      // Rounds 25, 26, 27, 28: T1 wins all 4 rounds -> reaches 16-12!
      const override: Array<1 | 2> = [];
      for (let i = 0; i < 12; i++) {
        override.push(1);
        override.push(2);
      } // 12-12
      override.push(1, 1, 1, 1); // T1 reaches 16 at round 28

      const mapRes = simulateCompetitiveMap('mirage', 'Mirage', teams[0], teams[1], 1, override);
      expect(mapRes.userScore).toBe(16);
      expect(mapRes.opponentScore).toBe(12);
      expect(mapRes.rounds).toHaveLength(28); // exactly 28 rounds, no extra round simulated!
      expect(mapRes.isOvertime).toBe(true);
      expect(mapRes.overtimeCount).toBe(1);
    });

    it('Correct side switches in regulation and overtime', () => {
      // Rounds 1-12: T1 is CT, T2 is T
      expect(getTeamSides(1).t1Side).toBe('CT');
      expect(getTeamSides(12).t1Side).toBe('CT');
      // Rounds 13-24: T1 is T, T2 is CT
      expect(getTeamSides(13).t1Side).toBe('T');
      expect(getTeamSides(24).t1Side).toBe('T');
      // Overtime 1:
      // Rounds 25, 26, 27: First half of OT1 -> T1 is CT
      expect(getTeamSides(25).phase).toBe('overtime');
      expect(getTeamSides(25).overtimeBlock).toBe(1);
      expect(getTeamSides(25).t1Side).toBe('CT');
      expect(getTeamSides(27).t1Side).toBe('CT');
      // Rounds 28, 29, 30: Second half of OT1 -> T1 is T
      expect(getTeamSides(28).t1Side).toBe('T');
      expect(getTeamSides(30).t1Side).toBe('T');
      // Overtime 2:
      // Rounds 31, 32, 33: First half of OT2 -> T1 is CT
      expect(getTeamSides(31).overtimeBlock).toBe(2);
      expect(getTeamSides(31).t1Side).toBe('CT');
    });
  });

  // ==========================================
  // SECTION 2: MAP VETO ENGINE TESTS (BO1 & BO3)
  // ==========================================
  describe('Map Veto Engine (BO1 & BO3)', () => {
    it('BO1 veto sequence: alternates bans until exactly 1 map remains', () => {
      let state: MapVetoState = {
        format: 'BO1',
        bannedMaps: [],
        pickedMaps: [],
        history: [],
        currentTurn: 'user_ban'
      };

      const mapIds = TOURNAMENT_MAPS.map(m => m.id); // 7 maps
      // 1. User bans
      state = transitionVetoState(state, mapIds[0], 'M0');
      expect(state.currentTurn).toBe('cpu_ban');
      expect(state.bannedMaps).toContain(mapIds[0]);

      // 2. CPU bans
      state = transitionVetoState(state, mapIds[1], 'M1');
      expect(state.currentTurn).toBe('user_ban');

      // 3. User bans
      state = transitionVetoState(state, mapIds[2], 'M2');
      // 4. CPU bans
      state = transitionVetoState(state, mapIds[3], 'M3');
      // 5. User bans
      state = transitionVetoState(state, mapIds[4], 'M4');
      // 6. CPU bans (6th ban on 7-map pool -> exactly 1 map remains)
      state = transitionVetoState(state, mapIds[5], 'M5');

      expect(state.currentTurn).toBe('completed');
      expect(state.pickedMaps).toHaveLength(1);
      expect(state.pickedMaps[0]).toBe(mapIds[6]);
      expect(state.deciderMap).toBe(mapIds[6]);
    });

    it('BO3 veto sequence: follows exact 7-step sequence and automatically assigns map 3', () => {
      let state: MapVetoState = {
        format: 'BO3',
        bannedMaps: [],
        pickedMaps: [],
        history: [],
        currentTurn: 'user_ban'
      };

      const maps = TOURNAMENT_MAPS;
      // Step 1: P1 (User) bans
      expect(getExpectedVetoStep('BO3', 0)?.action).toBe('ban');
      expect(getExpectedVetoStep('BO3', 0)?.actor).toBe('user');
      state = transitionVetoState(state, maps[0].id, maps[0].name);
      expect(state.currentTurn).toBe('cpu_ban');

      // Step 2: P2 (CPU) bans
      expect(getExpectedVetoStep('BO3', 1)?.action).toBe('ban');
      expect(getExpectedVetoStep('BO3', 1)?.actor).toBe('cpu');
      state = transitionVetoState(state, maps[1].id, maps[1].name);
      expect(state.currentTurn).toBe('user_pick');

      // Step 3: P1 (User) picks map 1
      expect(getExpectedVetoStep('BO3', 2)?.action).toBe('pick');
      expect(getExpectedVetoStep('BO3', 2)?.actor).toBe('user');
      state = transitionVetoState(state, maps[2].id, maps[2].name);
      expect(state.currentTurn).toBe('cpu_pick');
      expect(state.pickedMaps).toEqual([maps[2].id]);

      // Step 4: P2 (CPU) picks map 2
      expect(getExpectedVetoStep('BO3', 3)?.action).toBe('pick');
      expect(getExpectedVetoStep('BO3', 3)?.actor).toBe('cpu');
      state = transitionVetoState(state, maps[3].id, maps[3].name);
      expect(state.currentTurn).toBe('user_ban');
      expect(state.pickedMaps).toEqual([maps[2].id, maps[3].id]);

      // Step 5: P1 (User) bans
      expect(getExpectedVetoStep('BO3', 4)?.action).toBe('ban');
      expect(getExpectedVetoStep('BO3', 4)?.actor).toBe('user');
      state = transitionVetoState(state, maps[4].id, maps[4].name);
      expect(state.currentTurn).toBe('cpu_ban');

      // Step 6: P2 (CPU) bans
      expect(getExpectedVetoStep('BO3', 5)?.action).toBe('ban');
      expect(getExpectedVetoStep('BO3', 5)?.actor).toBe('cpu');
      state = transitionVetoState(state, maps[5].id, maps[5].name);

      // Step 7: Automatic decider assignment (no extra pick needed)
      expect(state.currentTurn).toBe('completed');
      expect(state.pickedMaps).toHaveLength(3);
      expect(state.pickedMaps).toEqual([maps[2].id, maps[3].id, maps[6].id]);
      expect(state.deciderMap).toBe(maps[6].id);
      expect(state.bannedMaps).toHaveLength(4);
    });

    it('Prevents duplicate picks or bans of already selected maps', () => {
      let state: MapVetoState = {
        format: 'BO3',
        bannedMaps: [],
        pickedMaps: [],
        history: [],
        currentTurn: 'user_ban'
      };

      state = transitionVetoState(state, TOURNAMENT_MAPS[0].id, TOURNAMENT_MAPS[0].name);

      // Attempting to ban the same map again should throw error
      expect(() => {
        transitionVetoState(state, TOURNAMENT_MAPS[0].id, TOURNAMENT_MAPS[0].name);
      }).toThrow();
    });

    it('BO5 veto sequence: 2 bans, 4 picks, 7th map becomes Map 5 automatically', () => {
      let state: MapVetoState = {
        format: 'BO5',
        bannedMaps: [],
        pickedMaps: [],
        history: [],
        currentTurn: 'user_ban'
      };

      const maps = TOURNAMENT_MAPS;
      // 1. P1 bans
      state = transitionVetoState(state, maps[0].id, maps[0].name);
      expect(state.currentTurn).toBe('cpu_ban');
      // 2. P2 bans
      state = transitionVetoState(state, maps[1].id, maps[1].name);
      expect(state.currentTurn).toBe('user_pick');
      // 3. P1 picks Map 1
      state = transitionVetoState(state, maps[2].id, maps[2].name);
      expect(state.currentTurn).toBe('cpu_pick');
      // 4. P2 picks Map 2
      state = transitionVetoState(state, maps[3].id, maps[3].name);
      expect(state.currentTurn).toBe('user_pick');
      // 5. P1 picks Map 3
      state = transitionVetoState(state, maps[4].id, maps[4].name);
      expect(state.currentTurn).toBe('cpu_pick');
      // 6. P2 picks Map 4 -> Map 5 assigned automatically
      state = transitionVetoState(state, maps[5].id, maps[5].name);

      expect(state.currentTurn).toBe('completed');
      expect(state.bannedMaps).toEqual([maps[0].id, maps[1].id]);
      expect(state.pickedMaps).toHaveLength(5);
      expect(state.pickedMaps).toEqual([
        maps[2].id,
        maps[3].id,
        maps[4].id,
        maps[5].id,
        maps[6].id
      ]);
      expect(state.deciderMap).toBe(maps[6].id);
    });
  });

  // ==========================================
  // SECTION 3: FULL 4-STAGE MAJOR PROGRESSION TESTS
  // ==========================================
  describe('Full 4-Stage Major Tournament Progression', () => {
    it('executes complete Stage 1 -> Stage 2 -> Stage 3 -> Playoffs (QF, SF, BO5 GF) progression and preserves state across JSON serialization', () => {
      // 1. Initialize Major at Stage 1 with 16 teams
      let major = initializeMajorTournament('major_test_1', 'Meu Time', dummyLineup, 92, { mirage: 5 }, 777);
      expect(major.machineState).toBe('stage1_active');
      expect(major.activeStageId).toBe('stage1');
      expect(major.stages.stage1.teams).toHaveLength(16);
      expect(new Set(major.stages.stage1.teams.map(t => t.id)).size).toBe(16);
      expect(major.stages.stage2).toBeUndefined();
      expect(major.stages.stage3).toBeUndefined();
      expect(major.playoffs).toBeUndefined();

      // 2. Simulate Stage 1 to completion: 8 qualifiers and 8 eliminations
      const s1Done = simulateSwissStageToCompletion(major.stages.stage1);
      major = {
        ...major,
        stages: { ...major.stages, stage1: s1Done }
      };
      major = completeCurrentSwissStage(major);
      expect(major.machineState).toBe('stage1_complete');

      const s1Quals = major.stages.stage1.teams.filter(t => t.status === 'qualified');
      const s1Elims = major.stages.stage1.teams.filter(t => t.status === 'eliminated');
      expect(s1Quals).toHaveLength(8);
      expect(s1Elims).toHaveLength(8);
      expect(s1Quals.every(t => t.wins === 3)).toBe(true);
      expect(s1Elims.every(t => t.losses === 3)).toBe(true);

      // 3. Advance to Stage 2: 8 Stage 1 qualifiers + 8 new Stage 2 entrants = 16 unique teams
      major = advanceToNextMajorStage(major);
      expect(major.machineState).toBe('stage2_active');
      expect(major.activeStageId).toBe('stage2');
      expect(major.stages.stage2).toBeDefined();
      const s2Teams = major.stages.stage2!.teams;
      expect(s2Teams).toHaveLength(16);
      expect(new Set(s2Teams.map(t => t.id)).size).toBe(16);

      // Verify all 8 Stage 1 qualifiers are in Stage 2 and no Stage 1 eliminated team re-entered
      const s2Ids = new Set(s2Teams.map(t => t.id));
      s1Quals.forEach(q => expect(s2Ids.has(q.id)).toBe(true));
      s1Elims.forEach(e => expect(s2Ids.has(e.id)).toBe(false));
      major.entryPools.stage2TeamIds.forEach(id => expect(s2Ids.has(id)).toBe(true));

      // Verify Stage 1 standings remain preserved
      expect(major.stages.stage1.teams.filter(t => t.status === 'qualified')).toHaveLength(8);

      // 4. Simulate Stage 2 to completion: 8 qualifiers and 8 eliminations
      const s2Done = simulateSwissStageToCompletion(major.stages.stage2!);
      major = {
        ...major,
        stages: { ...major.stages, stage2: s2Done }
      };
      major = completeCurrentSwissStage(major);
      expect(major.machineState).toBe('stage2_complete');

      const s2Quals = major.stages.stage2!.teams.filter(t => t.status === 'qualified');
      const s2Elims = major.stages.stage2!.teams.filter(t => t.status === 'eliminated');
      expect(s2Quals).toHaveLength(8);
      expect(s2Elims).toHaveLength(8);

      // 5. Advance to Stage 3: 8 Stage 2 qualifiers + 8 new Stage 3 entrants = 16 unique teams
      major = advanceToNextMajorStage(major);
      expect(major.machineState).toBe('stage3_active');
      expect(major.activeStageId).toBe('stage3');
      expect(major.stages.stage3).toBeDefined();
      const s3Teams = major.stages.stage3!.teams;
      expect(s3Teams).toHaveLength(16);
      expect(new Set(s3Teams.map(t => t.id)).size).toBe(16);

      const s3Ids = new Set(s3Teams.map(t => t.id));
      s2Quals.forEach(q => expect(s3Ids.has(q.id)).toBe(true));
      s2Elims.forEach(e => expect(s3Ids.has(e.id)).toBe(false));
      s1Elims.forEach(e => expect(s3Ids.has(e.id)).toBe(false));
      major.entryPools.stage3TeamIds.forEach(id => expect(s3Ids.has(id)).toBe(true));

      // 6. Simulate Stage 3 to completion: 8 playoff qualifiers
      const s3Done = simulateSwissStageToCompletion(major.stages.stage3!);
      major = {
        ...major,
        stages: { ...major.stages, stage3: s3Done }
      };
      major = completeCurrentSwissStage(major);
      expect(major.machineState).toBe('stage3_complete');

      const s3Quals = major.stages.stage3!.teams.filter(t => t.status === 'qualified');
      expect(s3Quals).toHaveLength(8);

      // 7. Advance to Playoffs: Quarterfinals have 8 teams across 4 BO3 matches, Semifinals not generated yet
      major = advanceToNextMajorStage(major);
      expect(major.machineState).toBe('playoffs_active');
      expect(major.activeStageId).toBe('playoffs');
      expect(major.playoffs).toBeDefined();
      expect(major.playoffs!.seededTeams).toHaveLength(8);
      expect(major.playoffs!.quarterfinals).toHaveLength(4);
      expect(major.playoffs!.quarterfinals.every(q => q.format === 'BO3')).toBe(true);
      expect(major.playoffs!.semifinals[0].team1).toBeUndefined();
      expect(major.champion).toBeUndefined();

      // Simulate Quarterfinals (4 BO3 matches)
      major.playoffs!.quarterfinals.forEach((qf, idx) => {
        const completedQf = simulateCpuVsCpuMatch(
          qf.match!,
          [qf.team1!, qf.team2!],
          major.seed + 500 + idx * 31
        );
        major = recordPlayoffMatchResult(major, completedQf);
      });

      // 8. Verify Semifinals contain the 4 quarterfinal winners along the exact bracket path (QF1vQF2, QF3vQF4)
      expect(major.playoffs!.currentRound).toBe('semifinals');
      const qfWinners = major.playoffs!.quarterfinals.map(q => q.match!.winnerId!);
      expect(qfWinners).toHaveLength(4);
      const sf1Teams = [major.playoffs!.semifinals[0].team1!.id, major.playoffs!.semifinals[0].team2!.id];
      const sf2Teams = [major.playoffs!.semifinals[1].team1!.id, major.playoffs!.semifinals[1].team2!.id];
      expect(sf1Teams).toContain(qfWinners[0]);
      expect(sf1Teams).toContain(qfWinners[1]);
      expect(sf2Teams).toContain(qfWinners[2]);
      expect(sf2Teams).toContain(qfWinners[3]);
      expect(major.playoffs!.grandFinal.team1).toBeUndefined();
      expect(major.champion).toBeUndefined();

      // Simulate Semifinals (2 BO3 matches)
      major.playoffs!.semifinals.forEach((sf, idx) => {
        const completedSf = simulateCpuVsCpuMatch(
          sf.match!,
          [sf.team1!, sf.team2!],
          major.seed + 700 + idx * 41
        );
        major = recordPlayoffMatchResult(major, completedSf);
      });

      // 9. Verify Grand Final contains the 2 semifinal winners and is BO5
      expect(major.playoffs!.currentRound).toBe('grand_final');
      const sfWinners = major.playoffs!.semifinals.map(s => s.match!.winnerId!);
      const gfTeams = [major.playoffs!.grandFinal.team1!.id, major.playoffs!.grandFinal.team2!.id];
      expect(gfTeams).toContain(sfWinners[0]);
      expect(gfTeams).toContain(sfWinners[1]);
      expect(major.playoffs!.grandFinal.format).toBe('BO5');
      expect(major.champion).toBeUndefined(); // Champion not declared before Grand Final completes

      // Simulate Grand Final (BO5)
      const gfSlot = major.playoffs!.grandFinal;
      const completedGf = simulateCpuVsCpuMatch(
        gfSlot.match!,
        [gfSlot.team1!, gfSlot.team2!],
        major.seed + 999
      );
      expect(completedGf.format).toBe('BO5');
      expect(completedGf.mapResults.length).toBeGreaterThanOrEqual(3);
      expect(completedGf.mapResults.length).toBeLessThanOrEqual(5);

      major = recordPlayoffMatchResult(major, completedGf);

      // 10. Champion declared only after BO5 final, and serialization preserves full tournament history
      expect(major.machineState).toBe('tournament_complete');
      expect(major.champion?.id).toBe(completedGf.winnerId);
      expect(major.runnerUp?.id).toBe(completedGf.loserId);

      // Test browser refresh persistence via JSON serialize/deserialize
      const restored = JSON.parse(JSON.stringify(major));
      expect(restored.machineState).toBe('tournament_complete');
      expect(restored.stages.stage1.teams).toHaveLength(16);
      expect(restored.stages.stage2.teams).toHaveLength(16);
      expect(restored.stages.stage3.teams).toHaveLength(16);
      expect(restored.champion.id).toBe(major.champion?.id);
    });

    it('never repeats the same matchup within the same Swiss stage, and resets matchup history on next stage', () => {
      for (let s = 1; s <= 15; s++) {
        let major = initializeMajorTournament('no-rematch-test', 'Dream V', mockRoster, 90, {}, s * 97);

        // Stage 1
        const s1 = simulateSwissStageToCompletion(major.stages.stage1);
        const s1Pairs = new Set<string>();
        s1.completedMatches.forEach(m => {
          const pairKey = [m.team1Id, m.team2Id].sort().join('_vs_');
          expect(s1Pairs.has(pairKey)).toBe(false);
          s1Pairs.add(pairKey);
        });

        major = completeCurrentSwissStage({ ...major, stages: { ...major.stages, stage1: s1 } });
        major = advanceToNextMajorStage(major);

        // Stage 2 (history resets for the new stage, but no rematches within Stage 2)
        expect(major.stages.stage2!.completedMatches).toHaveLength(0);
        const s2 = simulateSwissStageToCompletion(major.stages.stage2!);
        const s2Pairs = new Set<string>();
        s2.completedMatches.forEach(m => {
          const pairKey = [m.team1Id, m.team2Id].sort().join('_vs_');
          expect(s2Pairs.has(pairKey)).toBe(false);
          s2Pairs.add(pairKey);
        });

        major = completeCurrentSwissStage({ ...major, stages: { ...major.stages, stage2: s2 } });
        major = advanceToNextMajorStage(major);

        // Stage 3 (history resets for Stage 3, and no rematches within Stage 3)
        expect(major.stages.stage3!.completedMatches).toHaveLength(0);
        const s3 = simulateSwissStageToCompletion(major.stages.stage3!);
        const s3Pairs = new Set<string>();
        s3.completedMatches.forEach(m => {
          const pairKey = [m.team1Id, m.team2Id].sort().join('_vs_');
          expect(s3Pairs.has(pairKey)).toBe(false);
          s3Pairs.add(pairKey);
        });
      }
    });
  });
});
