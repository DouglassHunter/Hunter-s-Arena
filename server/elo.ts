export function calculateEloChange(
  ratingPlayer: number,
  ratingOpponent: number,
  outcome: 1 | 0 | 0.5, // 1 = win, 0 = loss, 0.5 = draw
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (ratingOpponent - ratingPlayer) / 400));
  const change = Math.round(kFactor * (outcome - expectedScore));
  return change;
}
