import { MatrixCell, RotationMatrix, RotationState, TetrominoType } from './types';

const BASE_TETROMINOES: Readonly<Record<TetrominoType, RotationMatrix>> = {
  [TetrominoType.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [TetrominoType.O]: [
    [1, 1],
    [1, 1],
  ],
  [TetrominoType.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [TetrominoType.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

function rotateMatrixClockwise(matrix: RotationMatrix): RotationMatrix {
  const rowCount = matrix.length;
  const colCount = matrix[0]?.length ?? 0;
  const rotated: MatrixCell[][] = [];

  for (let col = 0; col < colCount; col += 1) {
    const nextRow: MatrixCell[] = [];
    for (let row = rowCount - 1; row >= 0; row -= 1) {
      nextRow.push(matrix[row][col]);
    }
    rotated.push(nextRow);
  }

  return rotated;
}

function buildRotationStates(base: RotationMatrix): readonly RotationMatrix[] {
  const right = rotateMatrixClockwise(base);
  const reverse = rotateMatrixClockwise(right);
  const left = rotateMatrixClockwise(reverse);

  return [base, right, reverse, left] as const;
}

export const TETROMINO_ROTATIONS: Readonly<Record<TetrominoType, readonly RotationMatrix[]>> = {
  [TetrominoType.I]: buildRotationStates(BASE_TETROMINOES[TetrominoType.I]),
  [TetrominoType.O]: buildRotationStates(BASE_TETROMINOES[TetrominoType.O]),
  [TetrominoType.T]: buildRotationStates(BASE_TETROMINOES[TetrominoType.T]),
  [TetrominoType.S]: buildRotationStates(BASE_TETROMINOES[TetrominoType.S]),
  [TetrominoType.Z]: buildRotationStates(BASE_TETROMINOES[TetrominoType.Z]),
  [TetrominoType.J]: buildRotationStates(BASE_TETROMINOES[TetrominoType.J]),
  [TetrominoType.L]: buildRotationStates(BASE_TETROMINOES[TetrominoType.L]),
};

export function getTetrominoMatrix(type: TetrominoType, rotation: RotationState): RotationMatrix {
  return TETROMINO_ROTATIONS[type][rotation];
}

export function rotateClockwise(rotation: RotationState): RotationState {
  return ((rotation + 1) % 4) as RotationState;
}

export function rotateCounterClockwise(rotation: RotationState): RotationState {
  return ((rotation + 3) % 4) as RotationState;
}
