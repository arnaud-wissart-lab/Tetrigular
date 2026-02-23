import { ALL_TETROMINOES, Bag7Randomizer } from './bag7';

describe('Bag7Randomizer', () => {
  it('fournit 7 pièces uniques avant répétition', () => {
    const randomizer = new Bag7Randomizer(() => 0.42);
    const firstBag = Array.from({ length: 7 }, () => randomizer.next());

    expect(new Set(firstBag).size).toBe(7);
    expect(new Set(firstBag)).toEqual(new Set(ALL_TETROMINOES));
  });

  it('reconstruit un nouveau bag de 7 pièces uniques', () => {
    const randomizer = new Bag7Randomizer(() => 0.75);
    Array.from({ length: 7 }, () => randomizer.next());
    const secondBag = Array.from({ length: 7 }, () => randomizer.next());

    expect(new Set(secondBag).size).toBe(7);
    expect(new Set(secondBag)).toEqual(new Set(ALL_TETROMINOES));
  });
});
