import { TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';

describe('GameComponent', () => {
  const requestAnimationFrame = vi.fn<(callback: FrameRequestCallback) => number>(() => 1);
  const cancelAnimationFrame = vi.fn<(handle: number) => void>();

  beforeEach(async () => {
    window.localStorage.clear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: requestAnimationFrame,
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: cancelAnimationFrame,
    });

    await TestBed.configureTestingModule({
      imports: [GameComponent],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('démarre une partie depuis l’overlay et met à jour le template', () => {
    const fixture = TestBed.createComponent(GameComponent);
    fixture.detectChanges();

    const startButton = fixture.nativeElement.querySelector('.overlay button') as HTMLButtonElement;
    expect(startButton.textContent).toContain('Démarrer');

    startButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.overlay')).toBeNull();
    expect(fixture.nativeElement.querySelector('.hud')?.textContent).toContain('En cours');
  });

  it('propage le changement de thème au document et au stockage local', () => {
    const fixture = TestBed.createComponent(GameComponent);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const dayThemeButton = Array.from(
      nativeElement.querySelectorAll<HTMLButtonElement>('.theme-btn'),
    ).find((button) => button.textContent?.includes('Jour'));
    expect(dayThemeButton).toBeDefined();

    dayThemeButton?.click();
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('data-theme')).toBe('day');
    expect(window.localStorage.getItem('tetrigular-theme')).toBe('day');
  });
});
