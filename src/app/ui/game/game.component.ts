import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { InputAction, InputService } from '../../core/input/input.service';
import {
  canPlacePiece,
  cloneGrid,
  createEmptyGrid,
  hasCollision,
  mergePiece,
} from '../../game/domain/board';
import { getTetrominoMatrix } from '../../game/domain/tetromino';
import { GRID_HEIGHT, GRID_WIDTH, Grid, Piece, TetrominoType } from '../../game/domain/types';
import { GameEngine } from '../../game/engine/game-engine';
import { EngineStatus, GameEngineState } from '../../game/engine/game-state';
import { HudComponent } from '../hud/hud.component';
import { NextPieceComponent } from '../next-piece/next-piece.component';
import { OverlayComponent } from '../overlay/overlay.component';

interface ClearFlash {
  readonly rows: readonly number[];
  readonly startedAt: number;
  readonly durationMs: number;
}

const CLEAR_FLASH_MS = 190;

const PIECE_COLORS: Record<TetrominoType, string> = {
  I: '#35f3ff',
  O: '#ffe066',
  T: '#bf9eff',
  S: '#74f0a2',
  Z: '#ff7f9e',
  J: '#7fc5ff',
  L: '#ffb071',
};

@Component({
  selector: 'app-game',
  imports: [HudComponent, NextPieceComponent, OverlayComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent implements AfterViewInit {
  @ViewChild('boardCanvas', { static: true })
  private readonly boardCanvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly inputService = inject(InputService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly engine = new GameEngine();

  protected readonly status = signal<EngineStatus>('idle');
  protected readonly score = signal(0);
  protected readonly lines = signal(0);
  protected readonly level = signal(1);
  protected readonly nextPiece = signal<TetrominoType | null>(null);

  private lockedGrid: Grid = createEmptyGrid();
  private currentPiece: Piece | null = null;

  private flashes: ClearFlash[] = [];
  private context: CanvasRenderingContext2D | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private renderHandle: number | null = null;

  ngAfterViewInit(): void {
    this.canvasElement = this.boardCanvasRef?.nativeElement ?? null;
    this.context = this.canvasElement?.getContext('2d') ?? null;

    this.inputService.setInputTarget(this.canvasElement);
    this.inputService.setGameRunning(false);

    const unsubscribeInput = this.inputService.onAction((action) => {
      this.handleInputAction(action);
    });
    const unsubscribeState = this.engine.onStateChange((state) => {
      this.onEngineState(state);
    });
    const unsubscribeLinesCleared = this.engine.onLinesCleared((rows) => {
      this.flashes.push({
        rows,
        startedAt: this.now(),
        durationMs: CLEAR_FLASH_MS,
      });
    });

    this.syncState(this.engine.getState());

    this.destroyRef.onDestroy(() => {
      unsubscribeInput();
      unsubscribeState();
      unsubscribeLinesCleared();
      this.stopRenderLoop();
      this.engine.stop();
      this.inputService.setGameRunning(false);
      this.inputService.setInputTarget(null);
    });

    this.startRenderLoop();
  }

  protected startGame(): void {
    this.engine.start();
    this.focusCanvas();
  }

  protected restartGame(): void {
    this.engine.stop();
    this.engine.start();
    this.focusCanvas();
  }

  protected resumeGame(): void {
    this.engine.resume();
    this.focusCanvas();
  }

  protected focusCanvas(): void {
    this.canvasElement?.focus();
  }

  private handleInputAction(action: InputAction): void {
    switch (action.type) {
      case 'moveLeft':
        this.engine.moveLeft();
        return;
      case 'moveRight':
        this.engine.moveRight();
        return;
      case 'rotateCW':
        this.engine.rotateCW();
        return;
      case 'rotateCCW':
        this.engine.rotateCCW();
        return;
      case 'softDrop':
        this.engine.softDrop(action.enabled);
        return;
      case 'hardDrop':
        this.engine.hardDrop();
        return;
      case 'pause':
        if (this.status() === 'running') {
          this.engine.pause();
          return;
        }

        if (this.status() === 'paused') {
          this.engine.resume();
        }
        return;
      default:
        return;
    }
  }

  private onEngineState(state: GameEngineState): void {
    this.syncState(state);
  }

  private syncState(state: GameEngineState): void {
    this.lockedGrid = cloneGrid(state.grid);
    this.currentPiece = state.currentPiece === null ? null : { ...state.currentPiece };

    this.status.set(state.status);
    this.score.set(state.score);
    this.lines.set(state.lines);
    this.level.set(state.level);
    this.nextPiece.set(state.nextPiece);

    this.inputService.setGameRunning(state.status === 'running');
  }

  private startRenderLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.stopRenderLoop();
      this.renderHandle = this.requestAnimationFrame((time) => this.renderFrame(time));
    });
  }

  private stopRenderLoop(): void {
    if (this.renderHandle !== null) {
      this.cancelAnimationFrame(this.renderHandle);
      this.renderHandle = null;
    }
  }

  private renderFrame(timestamp: number): void {
    this.drawCanvas(timestamp);
    this.renderHandle = this.requestAnimationFrame((time) => this.renderFrame(time));
  }

  private drawCanvas(timestamp: number): void {
    if (this.canvasElement === null || this.context === null) {
      return;
    }

    this.syncCanvasResolution();

    const ctx = this.context;
    const canvasWidth = this.canvasElement.width;
    const canvasHeight = this.canvasElement.height;
    const cellWidth = canvasWidth / GRID_WIDTH;
    const cellHeight = canvasHeight / GRID_HEIGHT;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.drawBackground(ctx, canvasWidth, canvasHeight);

    const board = this.getComposedBoard();
    this.drawGrid(ctx, board, cellWidth, cellHeight);
    this.drawGhostPiece(ctx, cellWidth, cellHeight);
    this.drawClearFlashes(ctx, timestamp, cellWidth, cellHeight);
    this.drawGridLines(ctx, canvasWidth, canvasHeight, cellWidth, cellHeight);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0b1020');
    gradient.addColorStop(1, '#10192f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    board: Grid,
    cellWidth: number,
    cellHeight: number,
  ): void {
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        const cell = board[row][col];
        if (cell === null) {
          continue;
        }

        const x = col * cellWidth;
        const y = row * cellHeight;

        ctx.save();
        ctx.fillStyle = PIECE_COLORS[cell];
        ctx.shadowColor = PIECE_COLORS[cell];
        ctx.shadowBlur = 8;
        ctx.fillRect(x + 1.2, y + 1.2, cellWidth - 2.4, cellHeight - 2.4);

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgb(255 255 255 / 18%)';
        ctx.fillRect(x + 2.2, y + 2.2, cellWidth - 5.2, Math.max(2, cellHeight * 0.16));
        ctx.restore();
      }
    }
  }

  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cellWidth: number,
    cellHeight: number,
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgb(146 168 218 / 17%)';
    ctx.lineWidth = 1;

    for (let col = 0; col <= GRID_WIDTH; col += 1) {
      const x = Math.round(col * cellWidth) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let row = 0; row <= GRID_HEIGHT; row += 1) {
      const y = Math.round(row * cellHeight) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgb(176 196 238 / 36%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.restore();
  }

  private drawGhostPiece(
    ctx: CanvasRenderingContext2D,
    cellWidth: number,
    cellHeight: number,
  ): void {
    if (this.currentPiece === null) {
      return;
    }

    const ghostPiece = this.computeGhostPiece();
    if (ghostPiece === null || ghostPiece.y === this.currentPiece.y) {
      return;
    }

    const matrix = getTetrominoMatrix(ghostPiece.type, ghostPiece.rotation);
    ctx.save();
    ctx.strokeStyle = 'rgb(218 232 255 / 45%)';
    ctx.fillStyle = 'rgb(218 232 255 / 10%)';
    ctx.lineWidth = 1.2;

    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (matrix[row][col] === 0) {
          continue;
        }

        const x = (ghostPiece.x + col) * cellWidth;
        const y = (ghostPiece.y + row) * cellHeight;
        ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
        ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      }
    }

    ctx.restore();
  }

  private drawClearFlashes(
    ctx: CanvasRenderingContext2D,
    timestamp: number,
    cellWidth: number,
    cellHeight: number,
  ): void {
    this.flashes = this.flashes.filter((flash) => timestamp - flash.startedAt <= flash.durationMs);

    for (const flash of this.flashes) {
      const progress = Math.min(1, (timestamp - flash.startedAt) / flash.durationMs);
      const alpha = 0.55 * (1 - progress);
      ctx.save();
      ctx.fillStyle = `rgb(255 255 255 / ${alpha})`;
      ctx.shadowColor = 'rgb(255 255 255 / 72%)';
      ctx.shadowBlur = 12;

      for (const rowIndex of flash.rows) {
        const y = rowIndex * cellHeight;
        ctx.fillRect(0, y, GRID_WIDTH * cellWidth, cellHeight);
      }

      ctx.restore();
    }
  }

  private getComposedBoard(): Grid {
    const board = cloneGrid(this.lockedGrid);
    if (this.currentPiece === null) {
      return board;
    }

    if (hasCollision(this.lockedGrid, this.currentPiece)) {
      return board;
    }

    return mergePiece(board, this.currentPiece);
  }

  private computeGhostPiece(): Piece | null {
    if (this.currentPiece === null) {
      return null;
    }

    let candidate: Piece = { ...this.currentPiece };
    while (canPlacePiece(this.lockedGrid, { ...candidate, y: candidate.y + 1 })) {
      candidate = { ...candidate, y: candidate.y + 1 };
    }

    return candidate;
  }

  private syncCanvasResolution(): void {
    if (this.canvasElement === null || this.context === null) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = this.canvasElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
    const height = Math.max(1, Math.floor(rect.height * devicePixelRatio));

    if (this.canvasElement.width === width && this.canvasElement.height === height) {
      return;
    }

    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
  }

  private requestAnimationFrame(callback: FrameRequestCallback): number {
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback);
    }

    return window.setTimeout(() => callback(this.now()), 16);
  }

  private cancelAnimationFrame(handle: number): void {
    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(handle);
      return;
    }

    window.clearTimeout(handle);
  }

  private now(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }

    return Date.now();
  }
}
