import { Routes } from '@angular/router';
import { GameComponent } from './ui/game/game.component';

export const routes: Routes = [
  {
    path: '',
    component: GameComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
