import { TouchGesture, TouchGestureRecognizer, TouchPoint } from './touch-gesture-recognizer';

describe('TouchGestureRecognizer', () => {
  const PRESS_DELAY_MS: number = 30;
  let recognizer: TouchGestureRecognizer;
  let gestures: TouchGesture[];

  beforeEach(() => {
    gestures = [];
    recognizer = new TouchGestureRecognizer((gesture) => gestures.push(gesture), {
      pressSlop: 10,
      pressDelayMs: PRESS_DELAY_MS,
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

  /** Both fingers of a pair land in one event */
  function pinchStart(first: TouchPoint, second: TouchPoint) {
    recognizer.touchStart([first, second], [first, second]);
  }

  describe('one finger', () => {
    it('reports a tap as a press where it landed and a release where it lifted', () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      expect(gestures, 'the press is held back').toEqual([]);
      recognizer.touchEnd([], [touch(1, 12, 21)]);
      expect(gestures).toEqual([
        { type: 'press', point: finger },
        { type: 'release', point: touch(1, 12, 21) },
      ]);
    });

    it('presses where the finger landed once it moves past the slop, then drags and releases', () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchMove([touch(1, 15, 20)]);
      expect(gestures, 'a little movement does not tell a press from the first finger of a pair').toEqual([]);
      recognizer.touchMove([touch(1, 30, 20)]);
      recognizer.touchMove([touch(1, 40, 25)]);
      recognizer.touchEnd([], [touch(1, 50, 25)]);
      expect(gestures).toEqual([
        { type: 'press', point: finger },
        { type: 'drag', point: touch(1, 30, 20) },
        { type: 'drag', point: touch(1, 40, 25) },
        { type: 'release', point: touch(1, 50, 25) },
      ]);
    });

    it('presses once the finger has rested for the press delay', async () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      await wait(PRESS_DELAY_MS + 10);
      expect(gestures).toEqual([{ type: 'press', point: finger }]);
      recognizer.touchMove([touch(1, 12, 20)]);
      recognizer.touchEnd([], [touch(1, 12, 20)]);
      expect(gestures.slice(1)).toEqual([
        { type: 'drag', point: touch(1, 12, 20) },
        { type: 'release', point: touch(1, 12, 20) },
      ]);
    });

    it('ignores other fingers that move while the drawing finger stays', () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchMove([touch(1, 30, 20)]);
      recognizer.touchMove([touch(7, 30, 20)]);
      recognizer.touchEnd([finger], [touch(7, 30, 20)]);
      expect(gestures).toEqual([
        { type: 'press', point: finger },
        { type: 'drag', point: touch(1, 30, 20) },
      ]);
    });

    it('releases a press on touchcancel and drops a held back one silently', () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      recognizer.touchCancel([], [finger]);
      expect(gestures).toEqual([]);

      recognizer.touchStart([finger], [finger]);
      recognizer.touchMove([touch(1, 30, 20)]);
      recognizer.touchCancel([], [touch(1, 30, 20)]);
      expect(gestures).toEqual([
        { type: 'press', point: finger },
        { type: 'drag', point: touch(1, 30, 20) },
        { type: 'release', point: touch(1, 30, 20) },
      ]);
    });

    it('forgets a held back press on destroy without reporting it', async () => {
      const finger: TouchPoint = touch(1, 10, 20);
      recognizer.touchStart([finger], [finger]);
      recognizer.destroy();
      await wait(PRESS_DELAY_MS + 10);
      expect(gestures).toEqual([]);
    });
  });

  describe('two fingers', () => {
    it('starts a pinch at the midpoint when the second finger lands before the press is out, and presses nothing', async () => {
      recognizer.touchStart([touch(1, 100, 100)], [touch(1, 100, 100)]);
      recognizer.touchStart([touch(1, 100, 100), touch(2, 200, 150)], [touch(2, 200, 150)]);
      await wait(PRESS_DELAY_MS + 10);
      expect(gestures).toEqual([{ type: 'pinchStart', centre: { clientX: 150, clientY: 125 } }]);
    });

    it('releases a press where the drawing finger is when the second finger lands, then starts a pinch', () => {
      recognizer.touchStart([touch(1, 100, 100)], [touch(1, 100, 100)]);
      recognizer.touchMove([touch(1, 120, 100)]);
      recognizer.touchStart([touch(1, 120, 100), touch(2, 200, 100)], [touch(2, 200, 100)]);
      expect(gestures).toEqual([
        { type: 'press', point: touch(1, 100, 100) },
        { type: 'drag', point: touch(1, 120, 100) },
        { type: 'release', point: touch(1, 120, 100) },
        { type: 'pinchStart', centre: { clientX: 160, clientY: 100 } },
      ]);
    });

    it('reports every move with the midpoint, and a zoom step per sqrt(2) of distance change measured from the last step', () => {
      pinchStart(touch(1, 0, 0), touch(2, 100, 0));
      recognizer.touchMove([touch(1, 10, 0), touch(2, 130, 0)]);
      expect(gestures[1], 'a pan: 120 / 100 is no step').toEqual({
        type: 'pinch',
        centre: { clientX: 70, clientY: 0 },
        zoomIn: undefined,
      });
      recognizer.touchMove([touch(1, 10, 0), touch(2, 152, 0)]);
      expect(gestures[2]).toEqual({ type: 'pinch', centre: { clientX: 81, clientY: 0 }, zoomIn: true });
      recognizer.touchMove([touch(1, 10, 0), touch(2, 190, 0)]);
      expect(gestures[3], '180 / 142 is no step').toMatchObject({ zoomIn: undefined });
      recognizer.touchMove([touch(1, 10, 0), touch(2, 211, 0)]);
      expect(gestures[4], '201 / 142 is a step').toMatchObject({ zoomIn: true });
      expect(gestures.length).toBe(5);
    });

    it('zooms out when the fingers come together by a step', () => {
      pinchStart(touch(1, 0, 0), touch(2, 200, 0));
      recognizer.touchMove([touch(1, 0, 0), touch(2, 150, 0)]);
      recognizer.touchMove([touch(1, 0, 0), touch(2, 141, 0)]);
      expect(gestures.slice(1)).toEqual([
        { type: 'pinch', centre: { clientX: 75, clientY: 0 }, zoomIn: undefined },
        { type: 'pinch', centre: { clientX: 70.5, clientY: 0 }, zoomIn: false },
      ]);
    });

    it('does nothing with the finger left behind after a pinch until it lifts too', async () => {
      pinchStart(touch(1, 0, 0), touch(2, 100, 0));
      recognizer.touchEnd([touch(1, 0, 0)], [touch(2, 100, 0)]);
      recognizer.touchMove([touch(1, 50, 0)]);
      await wait(PRESS_DELAY_MS + 10);
      recognizer.touchEnd([], [touch(1, 50, 0)]);
      expect(gestures).toEqual([{ type: 'pinchStart', centre: { clientX: 50, clientY: 0 } }]);

      recognizer.touchStart([touch(3, 10, 10)], [touch(3, 10, 10)]);
      recognizer.touchEnd([], [touch(3, 10, 10)]);
      expect(gestures.slice(1), 'the next finger draws again').toEqual([
        { type: 'press', point: touch(3, 10, 10) },
        { type: 'release', point: touch(3, 10, 10) },
      ]);
    });

    it('stops at a third finger, and does not resume until every finger has lifted', () => {
      pinchStart(touch(1, 0, 0), touch(2, 100, 0));
      recognizer.touchStart([touch(1, 0, 0), touch(2, 100, 0), touch(3, 50, 50)], [touch(3, 50, 50)]);
      recognizer.touchMove([touch(1, 0, 0), touch(2, 200, 0), touch(3, 50, 50)]);
      recognizer.touchEnd([touch(1, 0, 0), touch(2, 200, 0)], [touch(3, 50, 50)]);
      recognizer.touchMove([touch(1, 0, 0), touch(2, 300, 0)]);
      recognizer.touchEnd([touch(1, 0, 0)], [touch(2, 300, 0)]);
      recognizer.touchStart([touch(1, 0, 0), touch(4, 100, 0)], [touch(4, 100, 0)]);
      recognizer.touchEnd([], [touch(1, 0, 0), touch(4, 100, 0)]);
      expect(gestures).toEqual([{ type: 'pinchStart', centre: { clientX: 50, clientY: 0 } }]);

      pinchStart(touch(1, 0, 0), touch(2, 100, 0));
      expect(gestures.length).toBe(2);
    });

    it('drops a pinch on touchcancel', () => {
      pinchStart(touch(1, 0, 0), touch(2, 100, 0));
      recognizer.touchCancel([], [touch(1, 0, 0), touch(2, 100, 0)]);
      recognizer.touchMove([touch(1, 0, 0), touch(2, 200, 0)]);
      expect(gestures.length).toBe(1);
    });
  });
});
