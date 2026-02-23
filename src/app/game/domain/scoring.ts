const SCORE_TABLE: Readonly<Record<number, number>> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export function scoreForClearedLines(lineCount: number): number {
  return SCORE_TABLE[lineCount] ?? 0;
}
