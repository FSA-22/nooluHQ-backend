export const getPercentageChange = (current: number, previous: number): number => {
  // Normalize inputs
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0) return curr === 0 ? 0 : 100;

  const result = ((curr - prev) / prev) * 100;

  // Prevent NaN / Infinity
  if (!Number.isFinite(result)) return 0;

  // Hard round to 2 decimal places
  return Math.round(result * 100) / 100;
};
