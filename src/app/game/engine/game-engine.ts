import { Bag7Randomizer } from '../domain/bag7';
import {
  canPlacePiece,
  clearLines,
  cloneGrid,
  createEmptyGrid,
  hasCollision,
  mergePiece,
} from '../domain/board';
import { scoreForClearedLines } from '../domain/scoring';
import { getTetrominoMatrix, rotateClockwise, rotateCounterClockwise } from '../domain/tetromino';
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  Grid,
  Piece,
  RotationState,
  TetrominoType,
} from '../domain/types';
import {
  BoardListener,
  GameEngineState,
  LinesClearedListener,
  ScoreListener,
  ScoreState,
  StateListener,
  Unsubscribe,
} from './game-state';

interface PieceRandomizer {
  next(): TetrominoType;
}

export interface GameEngineOptions {
  readonly width?: number;
  readonly height?: number;
  readonly lockDelayMs?: number;
  readonly softDropFactor?: number;
  readonly gravityForLevel?: (level: number) => number;
  readonly randomizer?: PieceRandomizer;
  readonly requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  readonly cancelAnimationFrame?: (handle: number) => void;
}

type Listener<T> = (payload: T) => void;

class EventBus<T> {
  private readonly listeners = new Set<Listener<T>>();

  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(payload: T): void {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}

function defaultRequestAnimationFrame(callback: FrameRequestCallback): number {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    return globalThis.requestAnimationFrame(callback);
  }

  return globalThis.setTimeout(() => callback(Date.now()), 16);
}

function defaultCancelAnimationFrame(handle: number): void {
  if (typeof globalThis.cancelAnimationFrame === 'function') {
    globalThis.cancelAnimationFrame(handle);
    return;
  }

  globalThis.clearTimeout(handle);
}

function defaultGravityForLevel(level: number): number {
  return Math.max(120, 700 - (level - 1) * 45);
}

export class GameEngine {
  private readonly width: number;
  private readonly height: number;
  private readonly lockDelayMs: number;
  private readonly softDropFactor: number;
  private readonly gravityForLevel: (level: number) => number;
  private readonly randomizer: PieceRandomizer;
  private readonly requestFrame: (callback: FrameRequestCallback) => number;
  private readonly cancelFrame: (handle: number) => void;

  private readonly stateBus = new EventBus<GameEngineState>();
  private readonly boardBus = new EventBus<Grid>();
  private readonly scoreBus = new EventBus<ScoreState>();
  private readonly linesClearedBus = new EventBus<readonly number[]>();

  private rafHandle: number | null = null;
  private previousFrameTime: number | null = null;
  private gravityAccumulatorMs = 0;
  private lockDelayElapsedMs = 0;
  private grounded = false;
  private softDropEnabled = false;

  private state: GameEngineState;

  constructor(options: GameEngineOptions = {}) {
    this.width = options.width ?? GRID_WIDTH;
    this.height = options.height ?? GRID_HEIGHT;
    this.lockDelayMs = options.lockDelayMs ?? 250;
    this.softDropFactor = options.softDropFactor ?? 8;
    this.gravityForLevel = options.gravityForLevel ?? defaultGravityForLevel;
    this.randomizer = options.randomizer ?? new Bag7Randomizer();
    this.requestFrame = options.requestAnimationFrame ?? defaultRequestAnimationFrame;
    this.cancelFrame = options.cancelAnimationFrame ?? defaultCancelAnimationFrame;

    this.state = {
      status: 'idle',
      grid: createEmptyGrid(this.width, this.height),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      lines: 0,
      level: 1,
    };
  }

  onStateChange(listener: StateListener): Unsubscribe {
    return this.stateBus.subscribe(listener);
  }

  onBoardChange(listener: BoardListener): Unsubscribe {
    return this.boardBus.subscribe(listener);
  }

  onScoreChange(listener: ScoreListener): Unsubscribe {
    return this.scoreBus.subscribe(listener);
  }

  onLinesCleared(listener: LinesClearedListener): Unsubscribe {
    return this.linesClearedBus.subscribe(listener);
  }

  getState(): GameEngineState {
    return {
      ...this.state,
      grid: cloneGrid(this.state.grid),
      currentPiece: this.state.currentPiece === null ? null : { ...this.state.currentPiece },
    };
  }

  getBoard(): Grid {
    return this.composeBoard();
  }

  getScore(): ScoreState {
    return {
      score: this.state.score,
      lines: this.state.lines,
      level: this.state.level,
    };
  }

  start(): void {
    if (this.state.status === 'running') {
      return;
    }

    if (this.state.status === 'paused') {
      this.state = {
        ...this.state,
        status: 'running',
      };
      this.publishState(false, false);
      this.startLoop();
      return;
    }

    this.startNewGame();
  }

  pause(): void {
    if (this.state.status !== 'running') {
      return;
    }

    this.state = {
      ...this.state,
      status: 'paused',
    };
    this.stopLoop();
    this.publishState(false, false);
  }

  resume(): void {
    if (this.state.status !== 'paused') {
      return;
    }

    this.start();
  }

  stop(): void {
    this.stopLoop();
    this.state = {
      ...this.state,
      status: 'idle',
      currentPiece: null,
      nextPiece: null,
      grid: createEmptyGrid(this.width, this.height),
      score: 0,
      lines: 0,
      level: 1,
    };
    this.gravityAccumulatorMs = 0;
    this.lockDelayElapsedMs = 0;
    this.grounded = false;
    this.softDropEnabled = false;
    this.publishState(true, true);
  }

  moveLeft(): boolean {
    return this.tryMoveHorizontal(-1);
  }

  moveRight(): boolean {
    return this.tryMoveHorizontal(1);
  }

  rotateCW(): boolean {
    return this.tryRotate(rotateClockwise);
  }

  rotateCCW(): boolean {
    return this.tryRotate(rotateCounterClockwise);
  }

  softDrop(enabled: boolean = true): void {
    this.softDropEnabled = enabled;
  }

  hardDrop(): boolean {
    if (this.state.status !== 'running' || this.state.currentPiece === null) {
      return false;
    }

    while (this.tryMoveDown()) {
      // Boucle volontaire: on cherche la position finale instantanee.
    }

    this.lockCurrentPiece();
    return true;
  }

  tick(deltaMs: number = 16): void {
    if (this.state.status !== 'running' || this.state.currentPiece === null) {
      return;
    }

    const intervalMs = this.getActiveGravityMs();
    this.gravityAccumulatorMs += Math.max(0, deltaMs);

    while (this.gravityAccumulatorMs >= intervalMs && this.state.currentPiece !== null) {
      this.gravityAccumulatorMs -= intervalMs;

      if (!this.tryMoveDown()) {
        // On stoppe ici pour eviter de "consommer" plusieurs collisions en une frame.
        this.gravityAccumulatorMs = 0;
        break;
      }
    }

    this.processLockDelay(deltaMs);
  }

  private startNewGame(): void {
    const currentType = this.randomizer.next();
    const nextType = this.randomizer.next();
    const currentPiece = this.createSpawnPiece(currentType);
    const emptyGrid = createEmptyGrid(this.width, this.height);

    const gameOver = hasCollision(emptyGrid, currentPiece);
    this.state = {
      status: gameOver ? 'gameOver' : 'running',
      grid: emptyGrid,
      currentPiece: gameOver ? null : currentPiece,
      nextPiece: nextType,
      score: 0,
      lines: 0,
      level: 1,
    };

    this.gravityAccumulatorMs = 0;
    this.lockDelayElapsedMs = 0;
    this.grounded = false;
    this.softDropEnabled = false;
    this.publishState(true, true);

    if (gameOver) {
      this.stopLoop();
      return;
    }

    this.startLoop();
  }

  private startLoop(): void {
    this.stopLoop();
    this.previousFrameTime = null;
    this.rafHandle = this.requestFrame(this.onAnimationFrame);
  }

  private stopLoop(): void {
    if (this.rafHandle !== null) {
      this.cancelFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.previousFrameTime = null;
  }

  private readonly onAnimationFrame = (timestampMs: number): void => {
    if (this.state.status !== 'running') {
      return;
    }

    if (this.previousFrameTime === null) {
      this.previousFrameTime = timestampMs;
    }

    const deltaMs = timestampMs - this.previousFrameTime;
    this.previousFrameTime = timestampMs;
    this.tick(deltaMs);

    if (this.state.status === 'running') {
      this.rafHandle = this.requestFrame(this.onAnimationFrame);
    }
  };

  private getActiveGravityMs(): number {
    const baseMs = this.gravityForLevel(this.state.level);
    if (!this.softDropEnabled) {
      return baseMs;
    }

    return Math.max(35, baseMs / this.softDropFactor);
  }

  private tryMoveHorizontal(deltaX: -1 | 1): boolean {
    if (this.state.status !== 'running' || this.state.currentPiece === null) {
      return false;
    }

    const candidate: Piece = {
      ...this.state.currentPiece,
      x: this.state.currentPiece.x + deltaX,
    };

    if (!canPlacePiece(this.state.grid, candidate)) {
      return false;
    }

    this.state = {
      ...this.state,
      currentPiece: candidate,
    };
    this.resetLockDelayAfterAction();
    this.publishState(true, false);
    return true;
  }

  private tryRotate(rotate: (rotation: RotationState) => RotationState): boolean {
    if (this.state.status !== 'running' || this.state.currentPiece === null) {
      return false;
    }

    const nextRotation = rotate(this.state.currentPiece.rotation);

    for (const xOffset of [0, -1, 1, -2, 2]) {
      const candidate: Piece = {
        ...this.state.currentPiece,
        x: this.state.currentPiece.x + xOffset,
        rotation: nextRotation,
      };

      if (!canPlacePiece(this.state.grid, candidate)) {
        continue;
      }

      this.state = {
        ...this.state,
        currentPiece: candidate,
      };
      this.resetLockDelayAfterAction();
      this.publishState(true, false);
      return true;
    }

    return false;
  }

  private tryMoveDown(): boolean {
    if (this.state.currentPiece === null) {
      return false;
    }

    const candidate: Piece = {
      ...this.state.currentPiece,
      y: this.state.currentPiece.y + 1,
    };

    if (!canPlacePiece(this.state.grid, candidate)) {
      return false;
    }

    this.state = {
      ...this.state,
      currentPiece: candidate,
    };
    this.grounded = false;
    this.lockDelayElapsedMs = 0;
    this.publishState(true, false);
    return true;
  }

  private processLockDelay(deltaMs: number): void {
    if (this.state.currentPiece === null) {
      return;
    }

    const pieceBelow: Piece = {
      ...this.state.currentPiece,
      y: this.state.currentPiece.y + 1,
    };
    const touchingFloor = hasCollision(this.state.grid, pieceBelow);

    if (!touchingFloor) {
      this.grounded = false;
      this.lockDelayElapsedMs = 0;
      return;
    }

    if (!this.grounded) {
      this.grounded = true;
      this.lockDelayElapsedMs = 0;
      return;
    }

    this.lockDelayElapsedMs += Math.max(0, deltaMs);
    if (this.lockDelayElapsedMs < this.lockDelayMs) {
      return;
    }

    this.lockCurrentPiece();
  }

  private lockCurrentPiece(): void {
    if (this.state.currentPiece === null) {
      return;
    }

    const mergedGrid = mergePiece(this.state.grid, this.state.currentPiece);
    const clearedRows = this.getClearedRows(mergedGrid);
    const clearResult = clearLines(mergedGrid);

    const updatedLines = this.state.lines + clearResult.clearedLines;
    const updatedScore = this.state.score + scoreForClearedLines(clearResult.clearedLines);
    const updatedLevel = Math.floor(updatedLines / 10) + 1;

    const nextCurrentType = this.state.nextPiece;
    const refreshedNextType = this.randomizer.next();
    const nextCurrentPiece =
      nextCurrentType === null ? null : this.createSpawnPiece(nextCurrentType);

    const willGameOver =
      nextCurrentPiece === null || hasCollision(clearResult.grid, nextCurrentPiece);

    this.state = {
      ...this.state,
      status: willGameOver ? 'gameOver' : this.state.status,
      grid: clearResult.grid,
      currentPiece: willGameOver ? null : nextCurrentPiece,
      nextPiece: refreshedNextType,
      score: updatedScore,
      lines: updatedLines,
      level: updatedLevel,
    };

    this.gravityAccumulatorMs = 0;
    this.lockDelayElapsedMs = 0;
    this.grounded = false;
    this.publishState(true, true);
    if (clearedRows.length > 0) {
      this.linesClearedBus.emit(clearedRows);
    }

    if (willGameOver) {
      this.stopLoop();
    }
  }

  private resetLockDelayAfterAction(): void {
    this.grounded = false;
    this.lockDelayElapsedMs = 0;
  }

  private createSpawnPiece(type: TetrominoType): Piece {
    const matrix = getTetrominoMatrix(type, RotationState.Spawn);
    const matrixWidth = matrix[0]?.length ?? 0;
    const spawnX = Math.floor((this.width - matrixWidth) / 2);

    return {
      type,
      x: spawnX,
      y: 0,
      rotation: RotationState.Spawn,
    };
  }

  private composeBoard(): Grid {
    const board = cloneGrid(this.state.grid);
    if (this.state.currentPiece === null) {
      return board;
    }

    if (hasCollision(this.state.grid, this.state.currentPiece)) {
      return board;
    }

    return mergePiece(board, this.state.currentPiece);
  }

  private getClearedRows(grid: Grid): number[] {
    const rows: number[] = [];

    for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
      if (grid[rowIndex].every((cell) => cell !== null)) {
        rows.push(rowIndex);
      }
    }

    return rows;
  }

  private publishState(boardChanged: boolean, scoreChanged: boolean): void {
    this.stateBus.emit(this.getState());
    if (boardChanged) {
      this.boardBus.emit(this.getBoard());
    }
    if (scoreChanged) {
      this.scoreBus.emit(this.getScore());
    }
  }
}
