import { TestBed } from '@angular/core/testing';
import { OverlayComponent } from './overlay.component';

describe('OverlayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayComponent],
    }).compileComponents();
  });

  it('affiche l’action de démarrage et émet la demande correspondante', () => {
    const fixture = TestBed.createComponent(OverlayComponent);
    const startRequested = vi.fn();
    fixture.componentInstance.startRequested.subscribe(startRequested);

    fixture.componentRef.setInput('status', 'idle');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Démarrer');

    button.click();
    expect(startRequested).toHaveBeenCalledOnce();
  });

  it('masque l’overlay lorsque la partie est en cours', () => {
    const fixture = TestBed.createComponent(OverlayComponent);

    fixture.componentRef.setInput('status', 'running');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.overlay')).toBeNull();
  });
});
