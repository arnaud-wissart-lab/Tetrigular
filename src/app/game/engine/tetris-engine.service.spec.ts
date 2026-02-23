import { TestBed } from '@angular/core/testing';
import { RandomService } from '../../core/services/random.service';
import { TetrisEngineService } from './tetris-engine.service';

class FakeRandomService {
  private index = 0;
  private readonly sequence = [0, 1, 2, 3, 4, 5, 6];

  nextInt(maxExclusive: number): number {
    const value = this.sequence[this.index % this.sequence.length] % maxExclusive;
    this.index += 1;
    return value;
  }
}

describe('TetrisEngineService', () => {
  let service: TetrisEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: RandomService, useClass: FakeRandomService }],
    });
    service = TestBed.inject(TetrisEngineService);
  });

  it('should initialize a running game', () => {
    const state = service.state();

    expect(state.status).toBe('running');
    expect(state.activePiece).toBeTruthy();
  });

  it('should move active piece to the left', () => {
    const initialCol = service.state().activePiece?.col;
    expect(initialCol).toBeDefined();

    service.moveLeft();

    expect(service.state().activePiece?.col).toBe((initialCol ?? 0) - 1);
  });

  it('should lock a piece after hard drop', () => {
    service.hardDrop();

    const lockedCells = service
      .state()
      .board.flat()
      .filter((cell) => cell !== null).length;

    expect(lockedCells).toBeGreaterThan(0);
    expect(service.state().activePiece).toBeTruthy();
  });

  it('should pause and resume game', () => {
    service.togglePause();
    expect(service.state().status).toBe('paused');

    service.togglePause();
    expect(service.state().status).toBe('running');
  });
});
