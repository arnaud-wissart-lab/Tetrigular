import { TetrominoType } from './types';

export const ALL_TETROMINOES: readonly TetrominoType[] = [
  TetrominoType.I,
  TetrominoType.O,
  TetrominoType.T,
  TetrominoType.S,
  TetrominoType.Z,
  TetrominoType.J,
  TetrominoType.L,
];

type RandomFn = () => number;

export class Bag7Randomizer {
  private bag: TetrominoType[] = [];

  constructor(private readonly randomFn: RandomFn = Math.random) {}

  next(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }

    const piece = this.bag.pop();
    if (piece === undefined) {
      throw new Error('Le 7-bag ne peut pas être vide ici.');
    }

    return piece;
  }

  private refillBag(): void {
    this.bag = [...ALL_TETROMINOES];

    for (let index = this.bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.randomFn() * (index + 1));
      [this.bag[index], this.bag[swapIndex]] = [this.bag[swapIndex], this.bag[index]];
    }
  }
}
