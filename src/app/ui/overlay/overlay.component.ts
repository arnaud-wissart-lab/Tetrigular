import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { EngineStatus } from '../../game/engine/game-state';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayComponent {
  readonly status = input.required<EngineStatus>();

  readonly startRequested = output<void>();
  readonly restartRequested = output<void>();
  readonly resumeRequested = output<void>();

  protected readonly visible = computed(() => this.status() !== 'running');
}
