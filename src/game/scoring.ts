export function calculateScore(playerTime: number, optimalTime: number): number {
  if (!Number.isFinite(playerTime) || playerTime <= 0) return 0;
  return Math.max(0, Math.min(1000, Math.round(1000 * optimalTime / playerTime)));
}

export function starsForScore(score: number): number {
  if (score >= 900) return 3;
  if (score >= 750) return 2;
  return 1;
}
