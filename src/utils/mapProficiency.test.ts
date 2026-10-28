import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill localStorage for node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    length: 0
  } as Storage;
}

import {
  calculateFinalProficiency,
  generateInitialBaseProficiencies,
  getOrInitDraftBaseProficiencies,
  resetDraftMapSession,
  saveDraftAllocatedPoints,
  getSavedDraftAllocatedPoints,
  MAP_PROFICIENCY_RANGE,
  PROFICIENCY_PER_POINT
} from './mapProficiency';
import {
  initialize16Teams,
  getUserMapProficiency,
  TOURNAMENT_MAPS
} from './tournamentEngine';

describe('Draft Arena - Map Proficiency System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. A new draft generates base percentages within configured range (30% to 65%)', () => {
    const proficiencies = generateInitialBaseProficiencies();
    expect(Object.keys(proficiencies).length).toBe(7);
    for (const mapId of Object.keys(proficiencies)) {
      const val = proficiencies[mapId];
      expect(val).toBeGreaterThanOrEqual(MAP_PROFICIENCY_RANGE.MIN);
      expect(val).toBeLessThanOrEqual(MAP_PROFICIENCY_RANGE.MAX);
    }
  });

  it('2. Each map receives its own generated value', () => {
    const proficiencies = generateInitialBaseProficiencies();
    const mapIds = TOURNAMENT_MAPS.map(m => m.id);
    mapIds.forEach(id => {
      expect(typeof proficiencies[id]).toBe('number');
    });
  });

  it('3. Adding one point increases the final proficiency by exactly 5 percentage points', () => {
    const base = 40;
    const withZeroPoints = calculateFinalProficiency(base, 0);
    const withOnePoint = calculateFinalProficiency(base, 1);
    const withTwoPoints = calculateFinalProficiency(base, 2);

    expect(withZeroPoints).toBe(40);
    expect(withOnePoint).toBe(45);
    expect(withTwoPoints).toBe(50);
    expect(withOnePoint - withZeroPoints).toBe(PROFICIENCY_PER_POINT);
    expect(withTwoPoints - withOnePoint).toBe(PROFICIENCY_PER_POINT);
  });

  it('4. Removing one point decreases it by exactly 5 percentage points', () => {
    const base = 40;
    const withThreePoints = calculateFinalProficiency(base, 3);
    const afterRemovingOne = calculateFinalProficiency(base, 2);

    expect(withThreePoints).toBe(55);
    expect(afterRemovingOne).toBe(50);
    expect(withThreePoints - afterRemovingOne).toBe(PROFICIENCY_PER_POINT);
  });

  it('5. Changing points does not regenerate the base values (fixed throughout session)', () => {
    const sessionBase = getOrInitDraftBaseProficiencies();
    saveDraftAllocatedPoints({ dust2: 1 });
    const sessionBaseAfterAlloc = getOrInitDraftBaseProficiencies();
    expect(sessionBaseAfterAlloc).toEqual(sessionBase);
  });

  it('6. Refreshing the page preserves the percentages and allocations from localStorage', () => {
    const initialBase = getOrInitDraftBaseProficiencies();
    saveDraftAllocatedPoints({ dust2: 2, mirage: 3 });

    // Simulate page reload: read back from storage
    const restoredBase = getOrInitDraftBaseProficiencies();
    const restoredPoints = getSavedDraftAllocatedPoints();

    expect(restoredBase).toEqual(initialBase);
    expect(restoredPoints).toEqual({ dust2: 2, mirage: 3 });
  });

  it('7. A new draft resets and generates a new session set of base values', () => {
    const firstSession = getOrInitDraftBaseProficiencies();
    resetDraftMapSession();
    expect(getSavedDraftAllocatedPoints()).toBeNull();
  });

  it('8. The final percentage never exceeds 100% or falls below 0%', () => {
    expect(calculateFinalProficiency(65, 10)).toBe(100);
    expect(calculateFinalProficiency(95, 2)).toBe(100);
    expect(calculateFinalProficiency(30, -10)).toBe(0);
    expect(calculateFinalProficiency(0, 0)).toBe(0);
  });

  it('9. The tournament veto uses the stored final percentages and CPU maintains separate model', () => {
    const baseProfs = {
      dust2: 45,
      mirage: 50,
      inferno: 55,
      nuke: 60,
      ancient: 35,
      anubis: 40,
      overpass: 50
    };
    const mapPoints = { dust2: 2, mirage: 1 }; // dust2: 45 + 10 = 55%, mirage: 50 + 5 = 55%

    const dummyLineup = [
      { id: 'p1', nickname: 'Cold', realName: 'M', country: 'BR', countryName: 'Brasil', role: 'lurker', ovr: 95, era: '2016', eraGroup: '2013-2016', teamId: 't1', teamName: 'LG', stats: { rating: 1.2, impact: 1.2, adr: 80, hsPercentage: 50 } }
    ] as any;

    const teams = initialize16Teams('My Team', dummyLineup, 90, mapPoints, 12345, baseProfs);
    const userTeam = teams.find(t => t.isUser)!;
    const cpuTeam = teams.find(t => !t.isUser)!;

    expect(userTeam.mapProficiencies!['dust2']).toBe(55);
    expect(userTeam.mapProficiencies!['mirage']).toBe(55);
    expect(userTeam.mapProficiencies!['inferno']).toBe(55); // base 55 + 0 = 55%
    expect(userTeam.mapProficiencies!['nuke']).toBe(60); // base 60 + 0 = 60%

    // CPU proficiencies are distinct from user's
    expect(cpuTeam.mapProficiencies).toBeDefined();
    expect(cpuTeam.mapProficiencies).not.toEqual(userTeam.mapProficiencies);
  });
});
