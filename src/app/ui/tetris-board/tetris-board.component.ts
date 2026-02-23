import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BoardMatrix } from '../../game/domain/tetromino.model';

@Component({
  selector: 'app-tetris-board',
  imports: [NgClass],
  templateUrl: './tetris-board.component.html',
  styleUrl: './tetris-board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisBoardComponent {
  readonly board = input.required<BoardMatrix>();
}
