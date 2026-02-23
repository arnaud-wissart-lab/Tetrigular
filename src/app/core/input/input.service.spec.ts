import { InputAction, InputService } from './input.service';

function dispatchKeyboardEvent(type: 'keydown' | 'keyup', code: string): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    code,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

describe('InputService', () => {
  let service: InputService;
  let focusTarget: HTMLCanvasElement;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new InputService();
    focusTarget = document.createElement('canvas');
    focusTarget.tabIndex = 0;
    document.body.appendChild(focusTarget);
    service.setInputTarget(focusTarget);
  });

  afterEach(() => {
    service.ngOnDestroy();
    focusTarget.remove();
    vi.useRealTimers();
  });

  it('applique le repeat horizontal avec DAS puis ARR', () => {
    focusTarget.focus();

    const actions: InputAction[] = [];
    const unsubscribe = service.onAction((action) => actions.push(action));

    const keydown = dispatchKeyboardEvent('keydown', 'ArrowRight');
    expect(keydown.defaultPrevented).toBe(true);
    expect(actions).toEqual([{ type: 'moveRight' }]);

    vi.advanceTimersByTime(119);
    expect(actions).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(actions).toHaveLength(2);
    expect(actions[1]).toEqual({ type: 'moveRight' });

    vi.advanceTimersByTime(60);
    expect(actions).toHaveLength(4);

    dispatchKeyboardEvent('keyup', 'ArrowRight');
    vi.advanceTimersByTime(200);
    expect(actions).toHaveLength(4);

    unsubscribe();
  });

  it('ignore les touches sans focus si le jeu ne tourne pas', () => {
    const actions: InputAction[] = [];
    const unsubscribe = service.onAction((action) => actions.push(action));

    const keydownWithoutCapture = dispatchKeyboardEvent('keydown', 'ArrowLeft');
    expect(keydownWithoutCapture.defaultPrevented).toBe(false);
    expect(actions).toHaveLength(0);

    service.setGameRunning(true);
    const keydownRunning = dispatchKeyboardEvent('keydown', 'ArrowLeft');
    expect(keydownRunning.defaultPrevented).toBe(true);
    expect(actions).toEqual([{ type: 'moveLeft' }]);

    unsubscribe();
  });
});
