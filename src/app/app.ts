import { Component, DestroyRef, computed, effect, inject } from '@angular/core';
import { GameLoopService } from './core/services/game-loop.service';
import { KeyboardInputService } from './core/services/keyboard-input.service';
import { TetrisEngineService } from './game/engine/tetris-engine.service';
import { TetrisBoardComponent } from './ui/tetris-board/tetris-board.component';
import { TetrisControlsComponent } from './ui/tetris-controls/tetris-controls.component';

@Component({
  selector: 'app-root',
  imports: [TetrisBoardComponent, TetrisControlsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly engine = inject(TetrisEngineService);
  private readonly gameLoopService = inject(GameLoopService);
  private readonly keyboardInputService = inject(KeyboardInputService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = this.engine.state;
  protected readonly board = this.engine.renderedBoard;

  private readonly dropIntervalMs = computed(() =>
    this.engine.getDropIntervalMs(this.state().level),
  );

  private readonly loopEffectRef = effect(() => {
    const gameState = this.state();

    if (gameState.status !== 'running') {
      this.gameLoopService.stop();
      return;
    }

    this.gameLoopService.start(() => this.engine.tick(), this.dropIntervalMs());
  });

  constructor() {
    this.engine.reset();

    const keyboardSubscription = this.keyboardInputService.keydown$.subscribe((event) => {
      this.handleKeyboardEvent(event);
    });

    this.destroyRef.onDestroy(() => {
      keyboardSubscription.unsubscribe();
      this.gameLoopService.stop();
      this.loopEffectRef.destroy();
    });
  }

  protected resetGame(): void {
    this.engine.reset();
  }

  protected togglePause(): void {
    this.engine.togglePause();
  }

  private handleKeyboardEvent(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyR':
        event.preventDefault();
        this.engine.reset();
        return;
      case 'KeyP':
        event.preventDefault();
        this.engine.togglePause();
        return;
      default:
        break;
    }

    if (this.state().status !== 'running') {
      return;
    }

    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        this.engine.moveLeft();
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.engine.moveRight();
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.engine.rotateClockwise();
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.engine.softDrop();
        return;
      case 'Space':
        event.preventDefault();
        this.engine.hardDrop();
        return;
      default:
        break;
    }
  }
}
