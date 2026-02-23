export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

export enum RotationState {
  Spawn = 0,
  Right = 1,
  Reverse = 2,
  Left = 3,
}

export type MatrixCell = 0 | 1;

export type RotationMatrix = ReadonlyArray<ReadonlyArray<MatrixCell>>;

export type Cell = TetrominoType | null;

export type Grid = Cell[][];

export interface Piece {
  readonly type: TetrominoType;
  readonly x: number;
  readonly y: number;
  readonly rotation: RotationState;
}
