import { TestBed } from '@angular/core/testing';
import { HudComponent } from './hud.component';

describe('HudComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HudComponent],
    }).compileComponents();
  });

  it('reflète les valeurs des inputs signal dans le tableau de bord', () => {
    const fixture = TestBed.createComponent(HudComponent);

    fixture.componentRef.setInput('status', 'running');
    fixture.componentRef.setInput('score', 1200);
    fixture.componentRef.setInput('lines', 14);
    fixture.componentRef.setInput('level', 2);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('En cours');
    expect(fixture.nativeElement.textContent).toContain('1200');
    expect(fixture.nativeElement.textContent).toContain('14');
    expect(fixture.nativeElement.textContent).toContain('2');
  });
});
