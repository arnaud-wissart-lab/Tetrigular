import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import { getTetrominoMatrix } from '../../game/domain/tetromino';
import { RotationState, TetrominoType } from '../../game/domain/types';

const PREVIEW_COLOR: Record<TetrominoType, string> = {
  I: '#38f0ff',
  O: '#ffe066',
  T: '#bf9eff',
  S: '#72f2a2',
  Z: '#ff7a99',
  J: '#7ec4ff',
  L: '#ffae70',
};

@Component({
  selector: 'app-next-piece',
  templateUrl: './next-piece.component.html',
  styleUrl: './next-piece.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextPieceComponent implements AfterViewInit {
  readonly nextPiece = input<TetrominoType | null>(null);

  @ViewChild('previewCanvas', { static: true })
  private readonly previewCanvasRef?: ElementRef<HTMLCanvasElement>;

  private context: CanvasRenderingContext2D | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  private readonly drawEffect = effect(() => {
    this.redraw(this.nextPiece());
  });

  ngAfterViewInit(): void {
    this.canvasElement = this.previewCanvasRef?.nativeElement ?? null;
    this.context = this.canvasElement?.getContext('2d') ?? null;
    this.redraw(this.nextPiece());
  }

  private redraw(pieceType: TetrominoType | null): void {
    if (this.context === null || this.canvasElement === null) {
      return;
    }

    const ctx = this.context;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgb(130 152 201 / 35%)';
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    if (pieceType === null) {
      return;
    }

    const matrix = getTetrominoMatrix(pieceType, RotationState.Spawn);
    const occupiedCells: Array<{ row: number; col: number }> = [];

    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (matrix[row][col] === 1) {
          occupiedCells.push({ row, col });
        }
      }
    }

    if (occupiedCells.length === 0) {
      return;
    }

    const minRow = Math.min(...occupiedCells.map((cell) => cell.row));
    const maxRow = Math.max(...occupiedCells.map((cell) => cell.row));
    const minCol = Math.min(...occupiedCells.map((cell) => cell.col));
    const maxCol = Math.max(...occupiedCells.map((cell) => cell.col));

    const shapeWidth = maxCol - minCol + 1;
    const shapeHeight = maxRow - minRow + 1;
    const cellSize = Math.floor(Math.min(width / (shapeWidth + 2), height / (shapeHeight + 2)));
    const offsetX = Math.floor((width - shapeWidth * cellSize) / 2);
    const offsetY = Math.floor((height - shapeHeight * cellSize) / 2);

    ctx.shadowColor = PREVIEW_COLOR[pieceType];
    ctx.shadowBlur = 8;
    ctx.fillStyle = PREVIEW_COLOR[pieceType];

    for (const cell of occupiedCells) {
      const x = offsetX + (cell.col - minCol) * cellSize;
      const y = offsetY + (cell.row - minRow) * cellSize;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    }

    ctx.shadowBlur = 0;
  }
}
