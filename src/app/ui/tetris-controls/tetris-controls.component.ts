import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GameStatus, PieceType } from '../../game/domain/tetromino.model';

@Component({
  selector: 'app-tetris-controls',
  templateUrl: './tetris-controls.component.html',
  styleUrl: './tetris-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisControlsComponent {
  readonly status = input.required<GameStatus>();
  readonly score = input.required<number>();
  readonly lines = input.required<number>();
  readonly level = input.required<number>();
  readonly nextPiece = input.required<PieceType>();

  readonly newGame = output<void>();
  readonly pauseToggle = output<void>();

  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'running':
        return 'En cours';
      case 'paused':
        return 'En pause';
      case 'game-over':
        return 'Termine';
    }
  });

  protected readonly pauseLabel = computed(() =>
    this.status() === 'paused' ? 'Reprendre' : 'Pause',
  );
}
