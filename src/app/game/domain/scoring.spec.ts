import { scoreForClearedLines } from './scoring';

describe('scoreForClearedLines', () => {
  it('retourne le score attendu pour 1, 2, 3, 4 lignes', () => {
    expect(scoreForClearedLines(1)).toBe(100);
    expect(scoreForClearedLines(2)).toBe(300);
    expect(scoreForClearedLines(3)).toBe(500);
    expect(scoreForClearedLines(4)).toBe(800);
  });

  it('retourne 0 pour les autres valeurs', () => {
    expect(scoreForClearedLines(0)).toBe(0);
    expect(scoreForClearedLines(5)).toBe(0);
    expect(scoreForClearedLines(-1)).toBe(0);
  });
});
