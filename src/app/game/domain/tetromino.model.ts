export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type BoardCell = PieceType | null;

export type BoardMatrix = ReadonlyArray<ReadonlyArray<BoardCell>>;

export interface ActivePiece {
  readonly type: PieceType;
  readonly matrix: ReadonlyArray<ReadonlyArray<number>>;
  readonly row: number;
  readonly col: number;
}

export type GameStatus = 'running' | 'paused' | 'game-over';

export interface GameState {
  readonly board: BoardMatrix;
  readonly activePiece: ActivePiece | null;
  readonly nextPiece: PieceType;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly status: GameStatus;
}
