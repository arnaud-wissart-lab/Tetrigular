import { Injectable, computed, inject, signal } from '@angular/core';
import { RandomService } from '../../core/services/random.service';
import {
  ActivePiece,
  BoardCell,
  BoardMatrix,
  GameState,
  PieceType,
} from '../domain/tetromino.model';
import { PIECE_TYPES, TETROMINO_SHAPES } from '../domain/tetrominoes.const';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const MIN_DROP_INTERVAL_MS = 120;
const START_DROP_INTERVAL_MS = 650;
const DROP_INTERVAL_STEP_MS = 45;

const POINTS_BY_LINES: Readonly<Record<number, number>> = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

@Injectable({
  providedIn: 'root',
})
export class TetrisEngineService {
  readonly boardWidth = BOARD_WIDTH;
  readonly boardHeight = BOARD_HEIGHT;
  private readonly randomService = inject(RandomService);

  private readonly gameState = signal<GameState>({
    board: this.createEmptyBoard(),
    activePiece: null,
    nextPiece: 'I',
    score: 0,
    lines: 0,
    level: 1,
    status: 'paused',
  });

  readonly state = this.gameState.asReadonly();

  readonly renderedBoard = computed(() => this.composeBoard(this.gameState()));

  constructor() {
    this.reset();
  }

  reset(): void {
    const firstPiece = this.pickPiece();
    const secondPiece = this.pickPiece();
    const board = this.createEmptyBoard();
    const activePiece = this.createPiece(firstPiece);

    this.gameState.set({
      board,
      activePiece: this.collides(board, activePiece) ? null : activePiece,
      nextPiece: secondPiece,
      score: 0,
      lines: 0,
      level: 1,
      status: this.collides(board, activePiece) ? 'game-over' : 'running',
    });
  }

  togglePause(): void {
    this.gameState.update((state) => {
      if (state.status === 'game-over') {
        return state;
      }

      return {
        ...state,
        status: state.status === 'running' ? 'paused' : 'running',
      };
    });
  }

  moveLeft(): void {
    this.moveHorizontally(-1);
  }

  moveRight(): void {
    this.moveHorizontally(1);
  }

  rotateClockwise(): void {
    const state = this.gameState();
    if (state.status !== 'running' || state.activePiece === null) {
      return;
    }

    const rotatedMatrix = this.rotateMatrixClockwise(state.activePiece.matrix);
    for (const shift of [0, -1, 1, -2, 2]) {
      const candidate: ActivePiece = {
        ...state.activePiece,
        matrix: rotatedMatrix,
        col: state.activePiece.col + shift,
      };

      if (!this.collides(state.board, candidate)) {
        this.gameState.set({
          ...state,
          activePiece: candidate,
        });
        return;
      }
    }
  }

  softDrop(): void {
    this.gameState.update((state) => {
      if (state.status !== 'running' || state.activePiece === null) {
        return state;
      }

      const candidate: ActivePiece = {
        ...state.activePiece,
        row: state.activePiece.row + 1,
      };

      if (!this.collides(state.board, candidate)) {
        return {
          ...state,
          activePiece: candidate,
        };
      }

      return this.lockAndSpawn(state);
    });
  }

  hardDrop(): void {
    this.gameState.update((state) => {
      if (state.status !== 'running' || state.activePiece === null) {
        return state;
      }

      let droppedPiece = state.activePiece;
      while (true) {
        const candidate: ActivePiece = {
          ...droppedPiece,
          row: droppedPiece.row + 1,
        };

        if (this.collides(state.board, candidate)) {
          break;
        }

        droppedPiece = candidate;
      }

      return this.lockAndSpawn({
        ...state,
        activePiece: droppedPiece,
      });
    });
  }

  tick(): void {
    this.softDrop();
  }

  getDropIntervalMs(level: number): number {
    return Math.max(
      MIN_DROP_INTERVAL_MS,
      START_DROP_INTERVAL_MS - (level - 1) * DROP_INTERVAL_STEP_MS,
    );
  }

  private moveHorizontally(offset: -1 | 1): void {
    this.gameState.update((state) => {
      if (state.status !== 'running' || state.activePiece === null) {
        return state;
      }

      const candidate: ActivePiece = {
        ...state.activePiece,
        col: state.activePiece.col + offset,
      };

      if (this.collides(state.board, candidate)) {
        return state;
      }

      return {
        ...state,
        activePiece: candidate,
      };
    });
  }

  private lockAndSpawn(state: GameState): GameState {
    if (state.activePiece === null) {
      return state;
    }

    // Le plateau est copie avant ecriture pour garder un flux d'etat explicite.
    const board = this.cloneBoard(state.board);

    for (let rowIndex = 0; rowIndex < state.activePiece.matrix.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < state.activePiece.matrix[rowIndex].length; colIndex += 1) {
        if (state.activePiece.matrix[rowIndex][colIndex] === 0) {
          continue;
        }

        const boardRow = state.activePiece.row + rowIndex;
        const boardCol = state.activePiece.col + colIndex;

        if (boardRow < 0) {
          return {
            ...state,
            activePiece: null,
            status: 'game-over',
          };
        }

        board[boardRow][boardCol] = state.activePiece.type;
      }
    }

    const { board: clearedBoard, clearedLines } = this.clearCompleteRows(board);
    const totalLines = state.lines + clearedLines;
    const level = Math.floor(totalLines / 10) + 1;
    const gainedPoints = (POINTS_BY_LINES[clearedLines] ?? clearedLines * 300) * state.level;

    const withUpdatedScore: GameState = {
      ...state,
      board: clearedBoard,
      activePiece: null,
      score: state.score + gainedPoints,
      lines: totalLines,
      level,
    };

    return this.spawnNextPiece(withUpdatedScore);
  }

  private spawnNextPiece(state: GameState): GameState {
    const activePiece = this.createPiece(state.nextPiece);
    const nextPiece = this.pickPiece();

    if (this.collides(state.board, activePiece)) {
      return {
        ...state,
        activePiece: null,
        nextPiece,
        status: 'game-over',
      };
    }

    return {
      ...state,
      activePiece,
      nextPiece,
      status: 'running',
    };
  }

  private clearCompleteRows(board: BoardCell[][]): { board: BoardCell[][]; clearedLines: number } {
    const remainingRows = board.filter((row) => row.some((cell) => cell === null));
    const clearedLines = BOARD_HEIGHT - remainingRows.length;

    while (remainingRows.length < BOARD_HEIGHT) {
      remainingRows.unshift(Array<BoardCell>(BOARD_WIDTH).fill(null));
    }

    return {
      board: remainingRows,
      clearedLines,
    };
  }

  private collides(board: BoardMatrix, piece: ActivePiece): boolean {
    for (let rowIndex = 0; rowIndex < piece.matrix.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < piece.matrix[rowIndex].length; colIndex += 1) {
        if (piece.matrix[rowIndex][colIndex] === 0) {
          continue;
        }

        const boardRow = piece.row + rowIndex;
        const boardCol = piece.col + colIndex;

        if (boardCol < 0 || boardCol >= BOARD_WIDTH || boardRow >= BOARD_HEIGHT) {
          return true;
        }

        if (boardRow >= 0 && board[boardRow][boardCol] !== null) {
          return true;
        }
      }
    }

    return false;
  }

  private createPiece(type: PieceType): ActivePiece {
    const matrix = TETROMINO_SHAPES[type];
    const width = matrix[0]?.length ?? 0;

    return {
      type,
      matrix,
      row: 0,
      col: Math.floor((BOARD_WIDTH - width) / 2),
    };
  }

  private pickPiece(): PieceType {
    const index = this.randomService.nextInt(PIECE_TYPES.length);
    return PIECE_TYPES[index];
  }

  private rotateMatrixClockwise(matrix: ReadonlyArray<ReadonlyArray<number>>): number[][] {
    const rowCount = matrix.length;
    const colCount = matrix[0]?.length ?? 0;
    const rotated: number[][] = [];

    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const nextRow: number[] = [];
      for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
        nextRow.push(matrix[rowIndex][colIndex]);
      }
      rotated.push(nextRow);
    }

    return rotated;
  }

  private composeBoard(state: GameState): BoardCell[][] {
    const board = this.cloneBoard(state.board);
    if (state.activePiece === null) {
      return board;
    }

    for (let rowIndex = 0; rowIndex < state.activePiece.matrix.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < state.activePiece.matrix[rowIndex].length; colIndex += 1) {
        if (state.activePiece.matrix[rowIndex][colIndex] === 0) {
          continue;
        }

        const boardRow = state.activePiece.row + rowIndex;
        const boardCol = state.activePiece.col + colIndex;
        if (boardRow < 0 || boardRow >= BOARD_HEIGHT || boardCol < 0 || boardCol >= BOARD_WIDTH) {
          continue;
        }

        board[boardRow][boardCol] = state.activePiece.type;
      }
    }

    return board;
  }

  private cloneBoard(board: BoardMatrix): BoardCell[][] {
    return board.map((row) => [...row]);
  }

  private createEmptyBoard(): BoardCell[][] {
    return Array.from({ length: BOARD_HEIGHT }, () => Array<BoardCell>(BOARD_WIDTH).fill(null));
  }
}
