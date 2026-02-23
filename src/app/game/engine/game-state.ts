import { Grid, Piece, TetrominoType } from '../domain/types';

export type EngineStatus = 'idle' | 'running' | 'paused' | 'gameOver';

export interface ScoreState {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
}

export interface GameEngineState extends ScoreState {
  readonly status: EngineStatus;
  readonly grid: Grid;
  readonly currentPiece: Piece | null;
  readonly nextPiece: TetrominoType | null;
}

export type StateListener = (state: GameEngineState) => void;
export type BoardListener = (board: Grid) => void;
export type ScoreListener = (score: ScoreState) => void;
export type LinesClearedListener = (rows: readonly number[]) => void;
export type Unsubscribe = () => void;
