import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

export const DEFAULT_DAS_MS = 120;
export const DEFAULT_ARR_MS = 30;

type HorizontalCode = 'ArrowLeft' | 'ArrowRight';
type ManagedCode = HorizontalCode | 'ArrowDown' | 'ArrowUp' | 'KeyX' | 'KeyZ' | 'Space' | 'KeyP';

export type InputAction =
  | { readonly type: 'moveLeft' }
  | { readonly type: 'moveRight' }
  | { readonly type: 'rotateCW' }
  | { readonly type: 'rotateCCW' }
  | { readonly type: 'softDrop'; readonly enabled: boolean }
  | { readonly type: 'hardDrop' }
  | { readonly type: 'pause' };

interface RepeatState {
  dasTimer: ReturnType<typeof setTimeout> | null;
  arrTimer: ReturnType<typeof setInterval> | null;
}

@Injectable({
  providedIn: 'root',
})
export class InputService implements OnDestroy {
  private readonly actionsSubject = new Subject<InputAction>();
  readonly actions$: Observable<InputAction> = this.actionsSubject.asObservable();

  private readonly pressedKeys = new Set<ManagedCode>();
  private readonly repeatByKey: Record<HorizontalCode, RepeatState> = {
    ArrowLeft: { dasTimer: null, arrTimer: null },
    ArrowRight: { dasTimer: null, arrTimer: null },
  };

  private targetElement: HTMLElement | null = null;
  private isGameRunning = false;
  private softDropActive = false;

  private dasMs = DEFAULT_DAS_MS;
  private arrMs = DEFAULT_ARR_MS;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: false });
    window.addEventListener('blur', this.handleWindowBlur);
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('blur', this.handleWindowBlur);
    }

    this.resetHeldInputs(false);
    this.actionsSubject.complete();
  }

  setInputTarget(element: HTMLElement | null): void {
    this.targetElement = element;
  }

  setGameRunning(running: boolean): void {
    this.isGameRunning = running;

    if (!running) {
      this.resetHeldInputs(true);
    }
  }

  configureRepeat(dasMs: number, arrMs: number): void {
    if (dasMs <= 0 || arrMs <= 0) {
      throw new Error('DAS et ARR doivent être strictement positifs.');
    }

    this.dasMs = dasMs;
    this.arrMs = arrMs;
  }

  onAction(listener: (action: InputAction) => void): () => void {
    const subscription: Subscription = this.actions$.subscribe(listener);
    return () => subscription.unsubscribe();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const code = this.toManagedCode(event.code);
    if (code === null) {
      return;
    }

    if (!this.shouldCapture()) {
      return;
    }

    event.preventDefault();

    if (this.pressedKeys.has(code)) {
      return;
    }
    this.pressedKeys.add(code);

    switch (code) {
      case 'ArrowLeft':
        this.emitAction({ type: 'moveLeft' });
        this.startHorizontalRepeat('ArrowLeft');
        return;
      case 'ArrowRight':
        this.emitAction({ type: 'moveRight' });
        this.startHorizontalRepeat('ArrowRight');
        return;
      case 'ArrowDown':
        if (!this.softDropActive) {
          this.softDropActive = true;
          this.emitAction({ type: 'softDrop', enabled: true });
        }
        return;
      case 'ArrowUp':
      case 'KeyX':
        this.emitAction({ type: 'rotateCW' });
        return;
      case 'KeyZ':
        this.emitAction({ type: 'rotateCCW' });
        return;
      case 'Space':
        this.emitAction({ type: 'hardDrop' });
        return;
      case 'KeyP':
        this.emitAction({ type: 'pause' });
        return;
      default:
        return;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const code = this.toManagedCode(event.code);
    if (code === null) {
      return;
    }

    const wasPressed = this.pressedKeys.delete(code);
    if (!wasPressed) {
      return;
    }

    if (this.shouldCapture() || this.isGameRunning) {
      event.preventDefault();
    }

    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      this.stopHorizontalRepeat(code);
      return;
    }

    if (code === 'ArrowDown' && this.softDropActive) {
      this.softDropActive = false;
      this.emitAction({ type: 'softDrop', enabled: false });
    }
  };

  private readonly handleWindowBlur = (): void => {
    this.resetHeldInputs(true);
  };

  private shouldCapture(): boolean {
    if (this.isGameRunning) {
      return true;
    }

    if (this.targetElement === null || typeof document === 'undefined') {
      return false;
    }

    const activeElement = document.activeElement;
    return (
      activeElement instanceof HTMLElement &&
      (activeElement === this.targetElement || this.targetElement.contains(activeElement))
    );
  }

  private toManagedCode(code: string): ManagedCode | null {
    switch (code) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
      case 'KeyX':
      case 'KeyZ':
      case 'Space':
      case 'KeyP':
        return code;
      default:
        return null;
    }
  }

  private startHorizontalRepeat(code: HorizontalCode): void {
    this.stopHorizontalRepeat(code);

    const repeatState = this.repeatByKey[code];
    repeatState.dasTimer = setTimeout(() => {
      if (!this.shouldContinueRepeating(code)) {
        this.stopHorizontalRepeat(code);
        return;
      }

      this.emitHorizontalAction(code);
      repeatState.arrTimer = setInterval(() => {
        if (!this.shouldContinueRepeating(code)) {
          this.stopHorizontalRepeat(code);
          return;
        }

        this.emitHorizontalAction(code);
      }, this.arrMs);
    }, this.dasMs);
  }

  private stopHorizontalRepeat(code: HorizontalCode): void {
    const repeatState = this.repeatByKey[code];

    if (repeatState.dasTimer !== null) {
      clearTimeout(repeatState.dasTimer);
      repeatState.dasTimer = null;
    }

    if (repeatState.arrTimer !== null) {
      clearInterval(repeatState.arrTimer);
      repeatState.arrTimer = null;
    }
  }

  private shouldContinueRepeating(code: HorizontalCode): boolean {
    return this.pressedKeys.has(code) && this.shouldCapture();
  }

  private emitHorizontalAction(code: HorizontalCode): void {
    this.emitAction({ type: code === 'ArrowLeft' ? 'moveLeft' : 'moveRight' });
  }

  private resetHeldInputs(emitSoftDropStop: boolean): void {
    this.pressedKeys.clear();
    this.stopHorizontalRepeat('ArrowLeft');
    this.stopHorizontalRepeat('ArrowRight');

    if (this.softDropActive) {
      this.softDropActive = false;
      if (emitSoftDropStop) {
        this.emitAction({ type: 'softDrop', enabled: false });
      }
    }
  }

  private emitAction(action: InputAction): void {
    this.actionsSubject.next(action);
  }
}
