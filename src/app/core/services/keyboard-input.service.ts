import { Injectable } from '@angular/core';
import { EMPTY, Observable, fromEvent, share } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class KeyboardInputService {
  private readonly source$: Observable<KeyboardEvent> =
    typeof window === 'undefined' ? EMPTY : fromEvent<KeyboardEvent>(window, 'keydown');

  // Un flux partage evite plusieurs ecoutes globales du clavier.
  readonly keydown$ = this.source$.pipe(share());
}
