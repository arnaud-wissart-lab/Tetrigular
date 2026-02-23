import { GameEngine } from './game-engine';
import { TetrominoType } from '../domain/types';

class FixedRandomizer {
  constructor(private readonly sequence: TetrominoType[]) {}

  next(): TetrominoType {
    const value = this.sequence.shift();
    if (value === undefined) {
      throw new Error('Séquence de test épuisée.');
    }

    return value;
  }
}

const noopRaf = () => 1;
const noopCaf = () => {};

describe('GameEngine', () => {
  it('place correctement la pièce avec hardDrop', () => {
    const engine = new GameEngine({
      randomizer: new FixedRandomizer([
        TetrominoType.O,
        TetrominoType.I,
        TetrominoType.T,
        TetrominoType.S,
      ]),
      requestAnimationFrame: noopRaf,
      cancelAnimationFrame: noopCaf,
    });

    engine.start();
    const spawnX = engine.getState().currentPiece?.x ?? 0;

    engine.hardDrop();

    const grid = engine.getState().grid;
    expect(grid[18][spawnX]).toBe(TetrominoType.O);
    expect(grid[18][spawnX + 1]).toBe(TetrominoType.O);
    expect(grid[19][spawnX]).toBe(TetrominoType.O);
    expect(grid[19][spawnX + 1]).toBe(TetrominoType.O);
  });

  it('respecte un lock delay simple avant fusion', () => {
    const engine = new GameEngine({
      randomizer: new FixedRandomizer([
        TetrominoType.O,
        TetrominoType.I,
        TetrominoType.T,
        TetrominoType.S,
      ]),
      gravityForLevel: () => 1,
      lockDelayMs: 250,
      requestAnimationFrame: noopRaf,
      cancelAnimationFrame: noopCaf,
    });

    engine.start();

    engine.tick(5000);
    let lockedCells = engine
      .getState()
      .grid.flat()
      .filter((cell) => cell === TetrominoType.O).length;
    expect(lockedCells).toBe(0);

    engine.tick(200);
    lockedCells = engine
      .getState()
      .grid.flat()
      .filter((cell) => cell === TetrominoType.O).length;
    expect(lockedCells).toBe(0);

    engine.tick(60);
    lockedCells = engine
      .getState()
      .grid.flat()
      .filter((cell) => cell === TetrominoType.O).length;
    expect(lockedCells).toBe(4);
  });

  it('consomme next piece puis la remplace', () => {
    const engine = new GameEngine({
      randomizer: new FixedRandomizer([
        TetrominoType.T,
        TetrominoType.L,
        TetrominoType.O,
        TetrominoType.I,
      ]),
      requestAnimationFrame: noopRaf,
      cancelAnimationFrame: noopCaf,
    });

    engine.start();
    let state = engine.getState();
    expect(state.currentPiece?.type).toBe(TetrominoType.T);
    expect(state.nextPiece).toBe(TetrominoType.L);

    engine.hardDrop();
    state = engine.getState();

    expect(state.currentPiece?.type).toBe(TetrominoType.L);
    expect(state.nextPiece).toBe(TetrominoType.O);
  });
});
