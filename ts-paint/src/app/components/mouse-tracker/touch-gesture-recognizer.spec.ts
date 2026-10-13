import { TouchGesture, TouchGestureRecognizer, TouchPoint } from './touch-gesture-recognizer';

describe('TouchGestureRecognizer', () => {
  const DRAG_WINDOW_MS: number = 30;
  let recognizer: TouchGestureRecognizer;
  let gestures: TouchGesture[];

  beforeEach(() => {
    gestures = [];
    recognizer = new TouchGestureRecognizer((gesture) => gestures.push(gesture), {
      tapSlop: 10,
      dragWindowMs: DRAG_WINDOW_MS,
      pinchStepRatio: Math.SQRT2,
    });
  });

  afterEach(() => recognizer.destroy());

  function touch(identifier: number, clientX: number, clientY: number): TouchPoint {
    return { identifier, clientX, clientY };
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** A single finger that goes down and up without moving */
  function tap(w: number, h: number, identifier: number = 1): boolean[] {
    const finger: TouchPoint = touch(identifier, w, h);
    return [recognizer.touchStart([finger], [finger]), recognizer.touchEnd([], [finger])];
  }

  describe('one finger', () => {
    it('reports a tap as a press and prevents only the touchend, so that no mouse events are synthesised', () => {
      expect(tap(10, 20)).toEqual([false, true]);
      expect(gestures).toEqual([{ type: 'press', point: touch(1, 10, 20) }]);
    });

    it('tolerates a little movement in a tap', () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchMove([touch(1, 15, 24)]);
      expect(recognizer.touchEnd([], [touch(1, 12, 22)])).toBe(true);
      expect(gestures).toEqual([{ type: 'press', point: touch(1, 12, 22) }]);
    });

    it('reports nothing and prevents nothing for a touch that moves, which is a scroll', () => {
      const finger: TouchPoint = touch(1, 10, 20);
      expect(recognizer.touchStart([finger], [finger])).toBe(false);
      expect(recognizer.touchMove([touch(1, 10, 30)])).toBe(false);
      expect(recognizer.touchMove([touch(1, 10, 21)])).toBe(false);
      expect(recognizer.touchEnd([], [touch(1, 10, 21)])).toBe(false);
      expect(gestures).toEqual([]);
    });

    it('releases the press at the tap point when no drag follows within the window', async () => {
      tap(10, 20);
      await wait(DRAG_WINDOW_MS / 2);
      expect(gestures.length, 'still waiting for a drag').toBe(1);
      await wait(DRAG_WINDOW_MS);
      expect(gestures).toEqual([
        { type: 'press', point: touch(1, 10, 20) },
        { type: 'release', point: touch(1, 10, 20) },
      ]);
    });
  });

  describe('tap and drag', () => {
    it('takes the next touch within the window as the drag, prevents its scrolling and releases when it lifts', async () => {
      tap(10, 20);
      const finger: TouchPoint = touch(2, 11, 21);
      expect(recognizer.touchStart([finger], [finger])).toBe(true);
      expect(recognizer.touchMove([touch(2, 30, 40)])).toBe(true);
      expect(recognizer.touchMove([touch(2, 50, 60)])).toBe(true);
      expect(recognizer.touchEnd([], [touch(2, 50, 60)])).toBe(true);
      expect(gestures).toEqual([
        { type: 'press', point: touch(1, 10, 20) },
        { type: 'drag', point: touch(2, 30, 40) },
        { type: 'drag', point: touch(2, 50, 60) },
        { type: 'release', point: touch(2, 50, 60) },
      ]);
      await wait(DRAG_WINDOW_MS * 2);
      expect(gestures.length, 'no second release from the timer').toBe(4);
    });

    it('is back in scrolling mode after the drag', () => {
      tap(10, 20);
      const finger: TouchPoint = touch(2, 11, 21);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchEnd([], [finger]);
      const scroller: TouchPoint = touch(3, 11, 21);
      expect(recognizer.touchStart([scroller], [scroller])).toBe(false);
      recognizer.touchMove([touch(3, 11, 80)]);
      expect(recognizer.touchEnd([], [touch(3, 11, 80)])).toBe(false);
      expect(gestures.length).toBe(2);
    });

    it('ignores extra fingers once the drag has moved, but keeps them from scrolling', () => {
      tap(10, 20);
      const finger: TouchPoint = touch(2, 11, 21);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchMove([touch(2, 20, 30)]);
      const extra: TouchPoint = touch(3, 100, 100);
      expect(recognizer.touchStart([finger, extra], [extra])).toBe(true);
      expect(recognizer.touchMove([touch(2, 30, 40), touch(3, 120, 120)])).toBe(true);
      expect(recognizer.touchEnd([finger], [touch(3, 120, 120)])).toBe(true);
      expect(recognizer.touchMove([touch(2, 35, 45)])).toBe(true);
      expect(gestures.slice(1)).toEqual([
        { type: 'drag', point: touch(2, 20, 30) },
        { type: 'drag', point: touch(2, 30, 40) },
        { type: 'drag', point: touch(2, 35, 45) },
      ]);
    });

    it('releases the press when the drag is cancelled by the system', () => {
      tap(10, 20);
      const finger: TouchPoint = touch(2, 11, 21);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchCancel([], [touch(2, 11, 21)]);
      expect(gestures[1]).toEqual({ type: 'release', point: touch(2, 11, 21) });
      const scroller: TouchPoint = touch(3, 11, 21);
      expect(recognizer.touchStart([scroller], [scroller]), 'back in scrolling mode').toBe(false);
    });

    it('turns the tap into a click when a second finger lands before the drag has moved: a pinch, not a drag', () => {
      tap(10, 20);
      const first: TouchPoint = touch(2, 100, 100);
      const second: TouchPoint = touch(3, 200, 100);
      recognizer.touchStart([first], [first]);
      expect(recognizer.touchStart([first, second], [second])).toBe(false);
      expect(recognizer.touchMove([first, touch(3, 250, 100)])).toBe(false);
      expect(gestures).toEqual([
        { type: 'press', point: touch(1, 10, 20) },
        { type: 'release', point: touch(1, 10, 20) },
        { type: 'pinch', zoomIn: true, centre: { clientX: 175, clientY: 100 } },
      ]);
    });

    it('forgets a pending tap on destroy without releasing it', async () => {
      tap(10, 20);
      recognizer.destroy();
      await wait(DRAG_WINDOW_MS * 2);
      expect(gestures.length).toBe(1);
    });
  });

  describe('pinch', () => {
    const first: TouchPoint = touch(1, 100, 100);
    const second: TouchPoint = touch(2, 200, 100);

    function startPinch() {
      recognizer.touchStart([first], [first]);
      recognizer.touchStart([first, second], [second]);
    }

    it('zooms in one step each time the distance grows by the step ratio, measured from the last step', () => {
      startPinch();
      expect(recognizer.touchMove([first, touch(2, 230, 100)]), 'not prevented, two fingers may pan').toBe(false);
      expect(gestures).toEqual([]);
      recognizer.touchMove([first, touch(2, 242, 100)]); // 142 / 100 >= sqrt(2)
      expect(gestures).toEqual([{ type: 'pinch', zoomIn: true, centre: { clientX: 171, clientY: 100 } }]);
      recognizer.touchMove([first, touch(2, 280, 100)]); // 180 / 142 < sqrt(2)
      expect(gestures.length).toBe(1);
      recognizer.touchMove([first, touch(2, 301, 100)]); // 201 / 142 >= sqrt(2)
      expect(gestures.length).toBe(2);
    });

    it('zooms out when the distance shrinks by the step ratio', () => {
      startPinch();
      recognizer.touchMove([first, touch(2, 171, 100)]); // 71 / 100 > 1 / sqrt(2)
      expect(gestures).toEqual([]);
      recognizer.touchMove([touch(1, 110, 100), touch(2, 180, 100)]); // 70 / 100 <= 1 / sqrt(2)
      expect(gestures).toEqual([{ type: 'pinch', zoomIn: false, centre: { clientX: 145, clientY: 100 } }]);
    });

    it('does not take the finger that stays after a pinch for a tap', () => {
      startPinch();
      expect(recognizer.touchEnd([second], [first])).toBe(false);
      expect(recognizer.touchEnd([], [second])).toBe(false);
      expect(gestures).toEqual([]);
    });

    it('stops with a third finger and resumes with two', () => {
      startPinch();
      const third: TouchPoint = touch(3, 150, 200);
      recognizer.touchStart([first, second, third], [third]);
      recognizer.touchMove([first, touch(2, 300, 100), third]);
      expect(gestures).toEqual([]);
      recognizer.touchEnd([first, second], [third]);
      recognizer.touchMove([first, touch(2, 300, 100)]);
      expect(gestures, 'the pinch base is gone until two fingers start again').toEqual([]);
    });
  });
});
