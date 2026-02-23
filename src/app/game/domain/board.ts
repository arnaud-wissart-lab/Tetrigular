import { getTetrominoMatrix } from './tetromino';
import { Cell, GRID_HEIGHT, GRID_WIDTH, Grid, Piece } from './types';

export interface ClearLinesResult {
  readonly grid: Grid;
  readonly clearedLines: number;
}

export interface LockResult {
  readonly grid: Grid;
  readonly locked: boolean;
}

export function createEmptyGrid(
  width: number = GRID_WIDTH,
  height: number = GRID_HEIGHT,
): Grid {
  return Array.from({ length: height }, () => Array<Cell>(width).fill(null));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function hasCollision(grid: Grid, piece: Piece): boolean {
  const matrix = getTetrominoMatrix(piece.type, piece.rotation);
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] === 0) {
        continue;
      }

      const x = piece.x + col;
      const y = piece.y + row;

      if (x < 0 || x >= width || y < 0 || y >= height) {
        return true;
      }

      if (grid[y][x] !== null) {
        return true;
      }
    }
  }

  return false;
}

export function canPlacePiece(grid: Grid, piece: Piece): boolean {
  return !hasCollision(grid, piece);
}

export function shouldLockPiece(grid: Grid, piece: Piece): boolean {
  const nextPiece: Piece = {
    ...piece,
    y: piece.y + 1,
  };

  return hasCollision(grid, nextPiece);
}

export function mergePiece(grid: Grid, piece: Piece): Grid {
  if (hasCollision(grid, piece)) {
    throw new Error('Impossible de fusionner une piece en collision.');
  }

  const nextGrid = cloneGrid(grid);
  const matrix = getTetrominoMatrix(piece.type, piece.rotation);

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] === 0) {
        continue;
      }

      const x = piece.x + col;
      const y = piece.y + row;
      nextGrid[y][x] = piece.type;
    }
  }

  return nextGrid;
}

export function lockPieceIfNeeded(grid: Grid, piece: Piece): LockResult {
  if (!shouldLockPiece(grid, piece)) {
    return {
      grid: cloneGrid(grid),
      locked: false,
    };
  }

  return {
    grid: mergePiece(grid, piece),
    locked: true,
  };
}

export function clearLines(grid: Grid): ClearLinesResult {
  const width = grid[0]?.length ?? GRID_WIDTH;
  const remainingRows = grid.filter((row) => row.some((cell) => cell === null));
  const clearedLines = grid.length - remainingRows.length;

  while (remainingRows.length < grid.length) {
    remainingRows.unshift(Array<Cell>(width).fill(null));
  }

  return {
    grid: remainingRows.map((row) => [...row]),
    clearedLines,
  };
}
