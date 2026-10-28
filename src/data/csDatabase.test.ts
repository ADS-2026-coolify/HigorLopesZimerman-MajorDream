import { describe, it, expect } from 'vitest';
import { CS_DATABASE, ALL_DATABASE_PLAYERS } from './csDatabase';
import { HISTORICAL_TEAMS, ALL_PLAYERS } from './csData';
import { getPlayerPortrait } from '../utils/playerAssets';
import { initialize16Teams } from '../utils/tournamentEngine';

describe('Draft Arena - CS Database Validation', () => {
  it('registers at least 32 distinct teams', () => {
    expect(CS_DATABASE.length).toBeGreaterThanOrEqual(32);
    expect(HISTORICAL_TEAMS.length).toBeGreaterThanOrEqual(32);
    const teamIds = new Set(CS_DATABASE.map(t => t.id));
    expect(teamIds.size).toBe(CS_DATABASE.length);
  });

  it('ensures every team has a valid unique ID, official name, shortName, season, and period', () => {
    for (const team of CS_DATABASE) {
      expect(team.id).toBeDefined();
      expect(team.id.trim().length).toBeGreaterThan(0);
      expect(team.name).toBeDefined();
      expect(team.name.trim().length).toBeGreaterThan(0);
      expect(team.shortName).toBeDefined();
      expect(team.shortName?.trim().length).toBeGreaterThan(0);
      expect(team.season).toBeDefined();
      expect(team.era).toBeDefined();
      expect(team.lineupYear).toBeDefined();
      expect(typeof team.lineupYear).toBe('number');
      expect(typeof team.isHistorical).toBe('boolean');
      expect(Array.isArray(team.tags)).toBe(true);
      expect(team.tags.length).toBeGreaterThan(0);
      expect(['Americas', 'Europe', 'Asia-Pacific']).toContain(team.region);
      expect(team.dataSource).toBeDefined();
      expect(team.verifiedDate).toBeDefined();
    }
  });

  it('ensures every team has exactly 5 distinct eligible players in its roster', () => {
    for (const team of CS_DATABASE) {
      expect(team.roster).toHaveLength(5);
      const playerIds = new Set(team.roster.map(p => p.id));
      expect(playerIds.size).toBe(5);
    }
  });

  it('ensures at least 160 distinct players exist without duplicate IDs across all teams', () => {
    expect(ALL_DATABASE_PLAYERS.length).toBeGreaterThanOrEqual(160);
    const uniqueIds = new Set(ALL_DATABASE_PLAYERS.map(p => p.id));
    expect(uniqueIds.size).toBe(ALL_DATABASE_PLAYERS.length);
    expect(uniqueIds.size).toBeGreaterThanOrEqual(160);
  });

  it('verifies team-player associations and defined player attributes', () => {
    for (const team of CS_DATABASE) {
      for (const player of team.roster) {
        expect(player.teamId).toBe(team.id);
        expect(player.nickname).toBeDefined();
        expect(player.nickname.trim().length).toBeGreaterThan(0);
        expect(player.realName).toBeDefined();
        expect(player.country).toBeDefined();
        expect(player.role).toBeDefined();
        expect(player.ovr).toBeGreaterThanOrEqual(70);
        expect(player.ovr).toBeLessThanOrEqual(99);
        expect(player.period).toBeDefined();
        expect(player.period!.length).toBeGreaterThan(0);
        expect(player.dataSource).toBeDefined();
        expect(player.verifiedDate).toBeDefined();
      }
    }
  });

  it('ensures missing player portraits fall back to safe neutral placeholders', () => {
    for (const player of ALL_DATABASE_PLAYERS) {
      const portrait = getPlayerPortrait(player.id, player.nickname);
      expect(portrait).toBeDefined();
      expect(portrait.initials).toBeDefined();
      expect(portrait.initials.length).toBeGreaterThan(0);
      expect(typeof portrait.hasVerifiedImage).toBe('boolean');
    }
  });

  it('ensures draft team selection yields only eligible players from that specific team', () => {
    for (const team of CS_DATABASE) {
      const rosterPlayers = ALL_DATABASE_PLAYERS.filter(p => p.teamId === team.id);
      expect(rosterPlayers).toHaveLength(5);
      expect(rosterPlayers.map(p => p.id)).toEqual(team.roster.map(p => p.id));
    }
  });

  it('generates unique tournament participants with user custom team not duplicated (16 teams)', () => {
    const userLineup = CS_DATABASE[0].roster;
    const tournamentTeams = initialize16Teams(
      'User Dream Team',
      userLineup,
      88,
      { 'de_mirage': 75 },
      42,
      undefined,
      16
    );

    expect(tournamentTeams).toHaveLength(16);

    const userCount = tournamentTeams.filter(t => t.id === 'user-team' || t.isUser).length;
    expect(userCount).toBe(1);

    const teamIds = new Set(tournamentTeams.map(t => t.id));
    expect(teamIds.size).toBe(16);

    for (const team of tournamentTeams) {
      expect(team.roster).toHaveLength(5);
    }
  });

  it('generates unique tournament participants with user custom team not duplicated (32 teams)', () => {
    const userLineup = CS_DATABASE[0].roster;
    const tournamentTeams = initialize16Teams(
      'User Dream Team',
      userLineup,
      88,
      { 'de_mirage': 75 },
      42,
      undefined,
      32
    );

    expect(tournamentTeams).toHaveLength(32);

    const userCount = tournamentTeams.filter(t => t.id === 'user-team' || t.isUser).length;
    expect(userCount).toBe(1);

    const teamIds = new Set(tournamentTeams.map(t => t.id));
    expect(teamIds.size).toBe(32);

    for (const team of tournamentTeams) {
      expect(team.roster).toHaveLength(5);
    }
  });
});
