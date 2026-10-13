export interface ClientPoint {
  clientX: number;
  clientY: number;
}

/** The parts of a DOM Touch the recognizer needs */
export interface TouchPoint extends ClientPoint {
  identifier: number;
}

export type TouchGesture =
  /** A tap: the start of a click or of a tap-and-drag */
  | { type: 'press'; point: TouchPoint }
  /** The finger that followed a tap has moved */
  | { type: 'drag'; point: TouchPoint }
  /** The press is over: the drag finger lifted, or no drag followed the tap within the window */
  | { type: 'release'; point: TouchPoint }
  /** Two fingers spread (zoomIn) or pinched by a step; centre is their midpoint */
  | { type: 'pinch'; zoomIn: boolean; centre: ClientPoint };

export interface TouchGestureOptions {
  /** Movement in css px up to which a touch still counts as a tap */
  tapSlop: number;
  /** How long after a tap the next touch is taken as the drag that follows it */
  dragWindowMs: number;
  /** Change of the distance between two fingers that triggers one zoom step */
  pinchStepRatio: number;
}

export const DEFAULT_TOUCH_GESTURE_OPTIONS: TouchGestureOptions = {
  tapSlop: 10,
  dragWindowMs: 500,
  pinchStepRatio: Math.SQRT2,
};

/**
 * Turns raw touches into the gestures the canvas understands. One finger normally scrolls (the browser does that,
 * nothing is reported), but a tap arms the canvas: the tap is reported as a press, the next touch within the drag
 * window is the drag that belongs to it, and lifting that finger (or the window running out without a drag)
 * releases the press. Two fingers pinch, one zoom step per `pinchStepRatio` of distance change.
 *
 * Every event method returns true when the browser's own handling of the event (scrolling, synthesised mouse
 * events) must be prevented.
 */
export class TouchGestureRecognizer {
  /** A single finger that may still turn out to be a tap */
  private _tapCandidate?: { identifier: number; start: TouchPoint; moved: boolean };
  /** The press reported for a tap, until it is released */
  private _tapPoint?: TouchPoint;
  private _dragTimer?: ReturnType<typeof setTimeout>;
  /** The finger that is drawing */
  private _dragFinger?: number;
  private _dragMoved: boolean = false;
  /** The distance between two fingers at the last zoom step, while pinching */
  private _pinchBaseDistance?: number;

  constructor(
    private _onGesture: (gesture: TouchGesture) => void,
    private _options: TouchGestureOptions = DEFAULT_TOUCH_GESTURE_OPTIONS
  ) {}

  touchStart(touches: TouchPoint[], changed: TouchPoint[]): boolean {
    if (this._dragFinger !== undefined) {
      if (this._dragMoved || touches.length !== 2) {
        return true; // Extra fingers during a drag are ignored, and must not scroll
      }
      this._dragFinger = undefined; // Both fingers of a pinch landed after a tap: the tap was a click
    }
    if (touches.length === 1) {
      const finger: TouchPoint = changed[0] ?? touches[0];
      if (this._tapPoint !== undefined) {
        this.clearDragTimer();
        this._dragFinger = finger.identifier;
        this._dragMoved = false;
        return true;
      }
      this._tapCandidate = { identifier: finger.identifier, start: finger, moved: false };
      return false;
    }
    this._tapCandidate = undefined;
    if (this._tapPoint !== undefined) {
      this.releaseTap(); // A pinch instead of a drag: the tap was a click
    }
    this._pinchBaseDistance = touches.length === 2 ? distance(touches[0], touches[1]) : undefined;
    return false;
  }

  touchMove(touches: TouchPoint[]): boolean {
    if (this._dragFinger !== undefined) {
      const finger: TouchPoint | undefined = findTouch(touches, this._dragFinger);
      if (finger !== undefined) {
        this._dragMoved = true;
        this._onGesture({ type: 'drag', point: finger });
      }
      return true;
    }
    if (this._pinchBaseDistance !== undefined && touches.length >= 2) {
      this.trackPinch(touches[0], touches[1]);
      return false;
    }
    if (this._tapCandidate !== undefined && !this._tapCandidate.moved) {
      const finger: TouchPoint | undefined = findTouch(touches, this._tapCandidate.identifier);
      if (finger !== undefined && distance(finger, this._tapCandidate.start) >= this._options.tapSlop) {
        this._tapCandidate.moved = true;
      }
    }
    return false;
  }

  touchEnd(touches: TouchPoint[], changed: TouchPoint[]): boolean {
    if (this._dragFinger !== undefined) {
      const finger: TouchPoint | undefined = findTouch(changed, this._dragFinger);
      if (finger !== undefined) {
        this.releaseDrag(finger);
      }
      return true;
    }
    if (this._pinchBaseDistance !== undefined) {
      if (touches.length < 2) {
        this._pinchBaseDistance = undefined;
      }
      return false;
    }
    if (this._tapCandidate !== undefined) {
      const finger: TouchPoint | undefined = findTouch(changed, this._tapCandidate.identifier);
      if (finger !== undefined) {
        const isTap: boolean = !this._tapCandidate.moved;
        this._tapCandidate = undefined;
        if (isTap) {
          this._tapPoint = finger;
          this._onGesture({ type: 'press', point: finger });
          this._dragTimer = setTimeout(() => this.releaseTap(), this._options.dragWindowMs);
          return true; // Keeps the browser from synthesising mouse events for the tap
        }
      }
    }
    return false;
  }

  touchCancel(touches: TouchPoint[], changed: TouchPoint[]): boolean {
    this._tapCandidate = undefined;
    if (touches.length < 2) {
      this._pinchBaseDistance = undefined;
    }
    if (this._dragFinger !== undefined) {
      const finger: TouchPoint | undefined = findTouch(changed, this._dragFinger);
      if (finger !== undefined) {
        this.releaseDrag(finger);
      }
    }
    return false;
  }

  /** Forgets a pending tap without releasing it; for when the element goes away */
  destroy() {
    this.clearDragTimer();
    this._tapPoint = undefined;
  }

  private trackPinch(first: TouchPoint, second: TouchPoint) {
    const currentDistance: number = distance(first, second);
    const ratio: number = currentDistance / this._pinchBaseDistance;
    const zoomIn: boolean = ratio >= this._options.pinchStepRatio;
    const zoomOut: boolean = ratio <= 1 / this._options.pinchStepRatio;
    if (zoomIn || zoomOut) {
      this._pinchBaseDistance = currentDistance;
      const centre: ClientPoint = {
        clientX: (first.clientX + second.clientX) / 2,
        clientY: (first.clientY + second.clientY) / 2,
      };
      this._onGesture({ type: 'pinch', zoomIn, centre });
    }
  }

  /** The press ends where the tap was: no drag followed it */
  private releaseTap() {
    this.releaseAt(this._tapPoint);
  }

  /** The press ends where the drag finger lifted */
  private releaseDrag(finger: TouchPoint) {
    this._dragFinger = undefined;
    this.releaseAt(finger);
  }

  private releaseAt(point: TouchPoint) {
    this.clearDragTimer();
    this._tapPoint = undefined;
    this._onGesture({ type: 'release', point });
  }

  private clearDragTimer() {
    if (this._dragTimer !== undefined) {
      clearTimeout(this._dragTimer);
      this._dragTimer = undefined;
    }
  }
}

function findTouch(touches: TouchPoint[], identifier: number): TouchPoint | undefined {
  return touches.find((touch) => touch.identifier === identifier);
}

function distance(a: ClientPoint, b: ClientPoint): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
