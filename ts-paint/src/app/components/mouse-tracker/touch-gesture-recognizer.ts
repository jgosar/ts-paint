export interface ClientPoint {
  clientX: number;
  clientY: number;
}

/** The parts of a DOM Touch the recognizer needs */
export interface TouchPoint extends ClientPoint {
  identifier: number;
}

export type TouchGesture =
  /** The drawing finger went down; the point is where it landed */
  | { type: 'press'; point: TouchPoint }
  /** The drawing finger moved */
  | { type: 'drag'; point: TouchPoint }
  /** The drawing finger lifted, or a second finger took over */
  | { type: 'release'; point: TouchPoint }
  /** Two fingers landed; centre is their midpoint */
  | { type: 'pinchStart'; centre: ClientPoint }
  /** The two fingers moved: their midpoint is at centre, and they zoomed by a step when zoomIn is set */
  | { type: 'pinch'; centre: ClientPoint; zoomIn?: boolean };

export interface TouchGestureOptions {
  /** Movement in css px from which a lone finger is surely drawing and not the first finger of a pair */
  pressSlop: number;
  /** How long a lone finger may rest before it is surely drawing and not the first finger of a pair */
  pressDelayMs: number;
  /** Change of the distance between two fingers that triggers one zoom step */
  pinchStepRatio: number;
}

export const DEFAULT_TOUCH_GESTURE_OPTIONS: TouchGestureOptions = {
  pressSlop: 10,
  pressDelayMs: 100,
  pinchStepRatio: Math.SQRT2,
};

/**
 * Turns raw touches into the gestures the canvas understands. One finger is the left mouse button: a press where
 * it lands, drags as it moves, a release when it lifts. Two fingers pan and zoom: every move reports their midpoint,
 * and one zoom step per `pinchStepRatio` of distance change.
 *
 * The press of a lone finger is held back until it moves past `pressSlop`, rests for `pressDelayMs` or lifts, so
 * that the second finger of a pan, which usually lands a moment after the first, does not leave a dot behind.
 * Once the press is out, a second finger releases it where the drawing finger is and the pair takes over.
 * Nothing resumes after a pair until every finger has lifted.
 */
export class TouchGestureRecognizer {
  /** A lone finger whose press is still held back */
  private _pending?: { finger: TouchPoint; timer: ReturnType<typeof setTimeout> };
  /** The finger that is drawing */
  private _drawFinger?: number;
  /** The distance between the two fingers at the last zoom step, while pinching */
  private _pinchBaseDistance?: number;
  /** Set when a pair broke up or a third finger landed: nothing happens until every finger has lifted */
  private _ignoreUntilLifted: boolean = false;

  constructor(
    private _onGesture: (gesture: TouchGesture) => void,
    private _options: TouchGestureOptions = DEFAULT_TOUCH_GESTURE_OPTIONS
  ) {}

  touchStart(touches: TouchPoint[], changed: TouchPoint[]) {
    if (this._ignoreUntilLifted) {
      return;
    }
    if (touches.length === 1) {
      const finger: TouchPoint = changed[0] ?? touches[0];
      this._pending = { finger, timer: setTimeout(() => this.commitPress(), this._options.pressDelayMs) };
    } else if (touches.length === 2) {
      this.dropPending();
      if (this._drawFinger !== undefined) {
        this.release(findTouch(touches, this._drawFinger) ?? changed[0]);
      }
      this._pinchBaseDistance = distance(touches[0], touches[1]);
      this._onGesture({ type: 'pinchStart', centre: midpoint(touches[0], touches[1]) });
    } else {
      this.dropPending();
      this._pinchBaseDistance = undefined;
      this._ignoreUntilLifted = true;
    }
  }

  touchMove(touches: TouchPoint[]) {
    if (this._ignoreUntilLifted) {
      return;
    }
    if (this._drawFinger !== undefined) {
      const finger: TouchPoint | undefined = findTouch(touches, this._drawFinger);
      if (finger !== undefined) {
        this._onGesture({ type: 'drag', point: finger });
      }
    } else if (this._pending !== undefined) {
      const finger: TouchPoint | undefined = findTouch(touches, this._pending.finger.identifier);
      if (finger !== undefined && distance(finger, this._pending.finger) >= this._options.pressSlop) {
        this.commitPress();
        this._onGesture({ type: 'drag', point: finger });
      }
    } else if (this._pinchBaseDistance !== undefined && touches.length >= 2) {
      this.trackPinch(touches[0], touches[1]);
    }
  }

  touchEnd(touches: TouchPoint[], changed: TouchPoint[]) {
    if (touches.length === 0) {
      this._ignoreUntilLifted = false;
    }
    if (this._drawFinger !== undefined) {
      const finger: TouchPoint | undefined = findTouch(changed, this._drawFinger);
      if (finger !== undefined) {
        this.release(finger);
      }
    } else if (this._pending !== undefined) {
      const finger: TouchPoint | undefined = findTouch(changed, this._pending.finger.identifier);
      if (finger !== undefined) {
        this.commitPress(); // A tap is a click
        this.release(finger);
      }
    } else if (this._pinchBaseDistance !== undefined && touches.length < 2) {
      this._pinchBaseDistance = undefined;
      this._ignoreUntilLifted = touches.length > 0; // The finger left behind must not start drawing
    }
  }

  touchCancel(touches: TouchPoint[], changed: TouchPoint[]) {
    this.dropPending();
    this._pinchBaseDistance = undefined;
    if (this._drawFinger !== undefined) {
      const finger: TouchPoint | undefined = findTouch(changed, this._drawFinger);
      if (finger !== undefined) {
        this.release(finger);
      }
    }
    this._ignoreUntilLifted = touches.length > 0;
  }

  /** Forgets a held back press without reporting it; for when the element goes away */
  destroy() {
    this.dropPending();
  }

  /** The held back press is surely a press: reports it where the finger landed */
  private commitPress() {
    const finger: TouchPoint = this._pending.finger;
    this.dropPending();
    this._drawFinger = finger.identifier;
    this._onGesture({ type: 'press', point: finger });
  }

  private dropPending() {
    if (this._pending !== undefined) {
      clearTimeout(this._pending.timer);
      this._pending = undefined;
    }
  }

  private release(point: TouchPoint) {
    this._drawFinger = undefined;
    this._onGesture({ type: 'release', point });
  }

  private trackPinch(first: TouchPoint, second: TouchPoint) {
    const currentDistance: number = distance(first, second);
    const ratio: number = currentDistance / this._pinchBaseDistance;
    let zoomIn: boolean | undefined;
    if (ratio >= this._options.pinchStepRatio) {
      zoomIn = true;
    } else if (ratio <= 1 / this._options.pinchStepRatio) {
      zoomIn = false;
    }
    if (zoomIn !== undefined) {
      this._pinchBaseDistance = currentDistance;
    }
    this._onGesture({ type: 'pinch', centre: midpoint(first, second), zoomIn });
  }
}

function findTouch(touches: TouchPoint[], identifier: number): TouchPoint | undefined {
  return touches.find((touch) => touch.identifier === identifier);
}

function distance(a: ClientPoint, b: ClientPoint): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function midpoint(a: ClientPoint, b: ClientPoint): ClientPoint {
  return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 };
}
