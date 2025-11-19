// Level thresholds (cumulative XP required to reach the start of each level)
// Index = level number. Example: LEVEL_XP[1] = 0 (level 1 starts at 0 XP)
export const LEVEL_XP: number[] = [
  0, // placeholder for 0 index
  0,    // Level 1 starts at 0 XP
  1000, // Level 2 starts at 1000 XP
  3000, // Level 3 starts at 3000 XP
  6000, // Level 4 starts at 6000 XP
  10000, // Level 5 starts at 10000 XP
  15000, // Level 6
  21000, // Level 7
  28000, // Level 8
  36000, // Level 9
  45000, // Level 10
];

export const MAX_DEFINED_LEVEL = LEVEL_XP.length - 1;

/**
 * Find the level for a given cumulative XP using the LEVEL_XP table.
 * If XP exceeds the table, it returns the highest defined level plus one
 * proportionally using the last interval.
 */
export function getLevelForXp(xp: number): number {
  if (xp <= 0) return 1;
  for (let lvl = LEVEL_XP.length - 1; lvl >= 1; lvl--) {
    if (xp >= LEVEL_XP[lvl]) return lvl;
  }
  return 1;
}

/**
 * Compute percent progress within the current level (0..100)
 */
export function getProgressPercent(xp: number): number {
  const level = getLevelForXp(xp);
  const currentLevelStart = LEVEL_XP[level] ?? 0;
  // Determine next level start. If next undefined, extrapolate using last interval
  let nextLevelStart = LEVEL_XP[level + 1];
  if (nextLevelStart === undefined) {
    // Use last two defined thresholds to estimate interval
    const last = LEVEL_XP[MAX_DEFINED_LEVEL];
    const prev = LEVEL_XP[MAX_DEFINED_LEVEL - 1] ?? Math.max(1000, last - 1000);
    const interval = last - prev || 1000;
    nextLevelStart = currentLevelStart + interval;
  }

  const within = Math.max(0, xp - currentLevelStart);
  const span = Math.max(1, nextLevelStart - currentLevelStart);
  const pct = (within / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Get XP needed to next level (remaining)
 */
export function xpToNextLevel(xp: number): number {
  const level = getLevelForXp(xp);
  const nextLevelStart = LEVEL_XP[level + 1] ?? (LEVEL_XP[level] + 1000);
  return Math.max(0, nextLevelStart - xp);
}
