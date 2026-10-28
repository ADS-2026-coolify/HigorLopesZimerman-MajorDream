import { ACTIVE_MAPS } from '../data/csData';

export const MAP_PROFICIENCY_RANGE = {
  MIN: 30,
  MAX: 65,
} as const;

export const PROFICIENCY_PER_POINT = 5;

/**
 * Calculates final proficiency: base proficiency + (allocated points * 5)
 * Clamped strictly between 0% and 100%.
 */
export function calculateFinalProficiency(baseProficiency: number, allocatedPoints: number): number {
  const finalVal = baseProficiency + allocatedPoints * PROFICIENCY_PER_POINT;
  return Math.min(100, Math.max(0, finalVal));
}

/**
 * Returns color style classes according to proficiency tiers:
 * - < 45%: Red/Rose (Weak)
 * - 45% - 59%: Amber/Orange (Moderate)
 * - 60% - 74%: Emerald/Green (Strong)
 * - >= 75%: Cyan/Sky/Purple (Elite/Mastery)
 */
export function getProficiencyTier(percentage: number): {
  barGradient: string;
  badgeBg: string;
  textColor: string;
  glow: string;
} {
  if (percentage >= 75) {
    return {
      barGradient: 'bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400',
      badgeBg: 'bg-sky-400 text-black',
      textColor: 'text-sky-400',
      glow: 'shadow-[0_0_12px_rgba(56,189,248,0.4)]'
    };
  }
  if (percentage >= 60) {
    return {
      barGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      badgeBg: 'bg-emerald-400 text-black',
      textColor: 'text-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]'
    };
  }
  if (percentage >= 45) {
    return {
      barGradient: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      badgeBg: 'bg-amber-400 text-black',
      textColor: 'text-amber-400',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]'
    };
  }
  return {
    barGradient: 'bg-gradient-to-r from-red-600 to-rose-500',
    badgeBg: 'bg-rose-500 text-white',
    textColor: 'text-rose-400',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]'
  };
}

/**
 * Generates initial random base proficiency for each map (30% to 65%).
 */
export function generateInitialBaseProficiencies(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const map of ACTIVE_MAPS) {
    result[map.id] = Math.floor(Math.random() * (MAP_PROFICIENCY_RANGE.MAX - MAP_PROFICIENCY_RANGE.MIN + 1)) + MAP_PROFICIENCY_RANGE.MIN;
  }
  return result;
}

const STORAGE_KEY_BASE_PROF = 'draftarena_draft_base_proficiencies';
const STORAGE_KEY_ALLOC_POINTS = 'draftarena_draft_allocated_points';

/**
 * Loads or generates base proficiencies for the current draft session.
 */
export function getOrInitDraftBaseProficiencies(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BASE_PROF);
    if (saved) {
      const parsed = JSON.parse(saved);
      const allMapsPresent = ACTIVE_MAPS.every(m => typeof parsed[m.id] === 'number');
      if (allMapsPresent) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read stored base proficiencies', e);
  }

  const generated = generateInitialBaseProficiencies();
  saveDraftBaseProficiencies(generated);
  return generated;
}

export function saveDraftBaseProficiencies(baseProficiencies: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_BASE_PROF, JSON.stringify(baseProficiencies));
  } catch (e) {
    console.error('Failed to save base proficiencies', e);
  }
}

export function getSavedDraftAllocatedPoints(): Record<string, number> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ALLOC_POINTS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to read stored allocated points', e);
  }
  return null;
}

export function saveDraftAllocatedPoints(points: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_ALLOC_POINTS, JSON.stringify(points));
  } catch (e) {
    console.error('Failed to save allocated points', e);
  }
}

export function resetDraftMapSession(): Record<string, number> {
  try {
    localStorage.removeItem(STORAGE_KEY_BASE_PROF);
    localStorage.removeItem(STORAGE_KEY_ALLOC_POINTS);
  } catch (e) {
    console.error('Failed to clear draft session storage', e);
  }
  return getOrInitDraftBaseProficiencies();
}
