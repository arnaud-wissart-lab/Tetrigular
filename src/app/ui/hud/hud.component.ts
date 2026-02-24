import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EngineStatus } from '../../game/engine/game-state';

@Component({
  selector: 'app-hud',
  templateUrl: './hud.component.html',
  styleUrl: './hud.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HudComponent {
  readonly score = input.required<number>();
  readonly lines = input.required<number>();
  readonly level = input.required<number>();
  readonly status = input.required<EngineStatus>();

  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'idle':
        return 'Prêt';
      case 'running':
        return 'En cours';
      case 'paused':
        return 'Pause';
      case 'gameOver':
        return 'Partie terminée';
    }
  });
}
