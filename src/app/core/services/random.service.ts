import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RandomService {
  // Centralise la génération pseudo-aléatoire pour faciliter les tests.
  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      throw new Error('maxExclusive doit être strictement positif.');
    }

    return Math.floor(Math.random() * maxExclusive);
  }
}
