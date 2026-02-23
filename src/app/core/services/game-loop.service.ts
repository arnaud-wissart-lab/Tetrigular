import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number | null = null;

  start(callback: () => void, intervalMs: number): void {
    if (this.timerId !== null && this.intervalMs === intervalMs) {
      return;
    }

    this.stop();
    this.intervalMs = intervalMs;
    this.timerId = setInterval(callback, intervalMs);
  }

  stop(): void {
    if (this.timerId === null) {
      return;
    }

    clearInterval(this.timerId);
    this.timerId = null;
    this.intervalMs = null;
  }
}
