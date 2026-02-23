import {
  canPlacePiece,
  clearLines,
  createEmptyGrid,
  hasCollision,
  lockPieceIfNeeded,
} from './board';
import { Piece, RotationState, TetrominoType } from './types';

function pieceAt(
  type: TetrominoType,
  x: number,
  y: number,
  rotation: RotationState = RotationState.Spawn,
): Piece {
  return { type, x, y, rotation };
}

describe('board domain', () => {
  it('détecte une pièce valide dans une grille vide', () => {
    const grid = createEmptyGrid();
    const piece = pieceAt(TetrominoType.T, 3, 0);

    expect(hasCollision(grid, piece)).toBe(false);
    expect(canPlacePiece(grid, piece)).toBe(true);
  });

  it('détecte une collision sur le bord gauche', () => {
    const grid = createEmptyGrid();
    const piece = pieceAt(TetrominoType.O, -1, 0);

    expect(hasCollision(grid, piece)).toBe(true);
    expect(canPlacePiece(grid, piece)).toBe(false);
  });

  it('détecte une collision avec des cellules occupées', () => {
    const grid = createEmptyGrid();
    grid[1][4] = TetrominoType.I;
    const piece = pieceAt(TetrominoType.O, 4, 0);

    expect(hasCollision(grid, piece)).toBe(true);
  });

  it('verrouille la pièce lorsqu’elle ne peut plus descendre', () => {
    const grid = createEmptyGrid();
    const piece = pieceAt(TetrominoType.O, 4, 18);

    const result = lockPieceIfNeeded(grid, piece);

    expect(result.locked).toBe(true);
    expect(result.grid[18][4]).toBe(TetrominoType.O);
    expect(result.grid[19][5]).toBe(TetrominoType.O);
  });

  it('supprime toutes les lignes pleines', () => {
    const grid = createEmptyGrid();

    for (let col = 0; col < 10; col += 1) {
      grid[18][col] = TetrominoType.J;
      grid[19][col] = TetrominoType.L;
    }
    grid[17][0] = TetrominoType.T;

    const result = clearLines(grid);

    expect(result.clearedLines).toBe(2);
    expect(result.grid[19][0]).toBe(TetrominoType.T);
    expect(result.grid[0].every((cell) => cell === null)).toBe(true);
    expect(result.grid[1].every((cell) => cell === null)).toBe(true);
  });
});
