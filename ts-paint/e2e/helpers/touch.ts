import { CDPSession, Page } from '@playwright/test';

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Real touch input through the Chrome DevTools Protocol, which Playwright's own touchscreen (taps only) cannot do.
 * The events go through Chromium's gesture detection, so `touch-action` and `preventDefault` really apply. Needs a
 * context with `hasTouch: true`.
 */
export class Touchscreen {
  private constructor(private readonly _cdp: CDPSession) {}

  static async create(page: Page): Promise<Touchscreen> {
    return new Touchscreen(await page.context().newCDPSession(page));
  }

  /** Puts fingers down at `points`; each finger keeps the index it has here in later moves */
  async start(points: ScreenPoint[]): Promise<void> {
    await this.send('touchStart', points);
  }

  async move(points: ScreenPoint[]): Promise<void> {
    await this.send('touchMove', points);
  }

  /** Lifts every finger */
  async end(): Promise<void> {
    await this.send('touchEnd', []);
  }

  async tap(point: ScreenPoint): Promise<void> {
    await this.start([point]);
    await this.end();
  }

  /** One finger down at `from`, moved to `to` in a few steps and lifted there */
  async drag(from: ScreenPoint, to: ScreenPoint, steps: number = 5): Promise<void> {
    await this.start([from]);
    for (let step = 1; step <= steps; step++) {
      await this.move([interpolate(from, to, step / steps)]);
    }
    await this.end();
  }

  /** Two fingers side by side around `from`, moved together to `to` in a few steps and lifted there */
  async pan(from: ScreenPoint, to: ScreenPoint, fingerDistance: number = 60, steps: number = 5): Promise<void> {
    const fingers = (centre: ScreenPoint): ScreenPoint[] => [
      { x: centre.x - fingerDistance / 2, y: centre.y },
      { x: centre.x + fingerDistance / 2, y: centre.y },
    ];
    await this.start(fingers(from));
    for (let step = 1; step <= steps; step++) {
      await this.move(fingers(interpolate(from, to, step / steps)));
    }
    await this.end();
  }

  /** Two fingers, side by side around `centre`, that change their distance from `fromDistance` to `toDistance` */
  async pinch(centre: ScreenPoint, fromDistance: number, toDistance: number, steps: number = 5): Promise<void> {
    const fingers = (distance: number): ScreenPoint[] => [
      { x: centre.x - distance / 2, y: centre.y },
      { x: centre.x + distance / 2, y: centre.y },
    ];
    await this.start(fingers(fromDistance));
    for (let step = 1; step <= steps; step++) {
      await this.move(fingers(fromDistance + ((toDistance - fromDistance) * step) / steps));
    }
    await this.end();
  }

  private async send(type: 'touchStart' | 'touchMove' | 'touchEnd', points: ScreenPoint[]): Promise<void> {
    await this._cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map((point, id) => ({ x: point.x, y: point.y, id })),
    });
  }
}

function interpolate(from: ScreenPoint, to: ScreenPoint, fraction: number): ScreenPoint {
  return { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
}
