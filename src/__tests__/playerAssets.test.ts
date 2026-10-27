import { describe, it, expect } from 'vitest';
import { getPlayerPortrait } from '../utils/playerAssets';

describe('Player Portrait Resolution Tests', () => {
  it('returns verified photo for verified professional players', () => {
    const fallen = getPlayerPortrait('fallen-2016', 'FalleN');
    expect(fallen.hasVerifiedImage).toBe(true);
    expect(fallen.url).toBeDefined();
    expect(fallen.initials).toBe('FA');

    const simple = getPlayerPortrait('s1mple-2021', 's1mple');
    expect(simple.hasVerifiedImage).toBe(true);
    expect(simple.url).toBeDefined();
  });

  it('strictly returns neutral initials avatar for unverified players to prevent false face association', () => {
    const unverified = getPlayerPortrait('unknown-pro', 'Stewie2K');
    expect(unverified.hasVerifiedImage).toBe(false);
    expect(unverified.url).toBeUndefined();
    expect(unverified.initials).toBe('ST');
  });
});
