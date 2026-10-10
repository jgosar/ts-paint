/**
 * A minimal stand-in for the DOCUMENT token: just the parts of the window and the body that services touch.
 * It is deliberately not a real Document, so tests can set the devicePixelRatio, see the dispatched events
 * and fire the media query "change" listeners themselves.
 */

type ChangeListener = (event: Event) => void;

export class FakeMediaQueryList {
  private _listeners: { listener: ChangeListener; once: boolean }[] = [];

  constructor(public media: string) {}

  addEventListener(type: string, listener: ChangeListener, options?: boolean | AddEventListenerOptions): void {
    if (type === 'change') {
      this._listeners.push({ listener, once: typeof options === 'object' && options?.once === true });
    }
  }

  get listenerCount(): number {
    return this._listeners.length;
  }

  /** Fires the "change" listeners as the browser would when the query stops (or starts) matching */
  fireChange(): void {
    const toCall = [...this._listeners];
    this._listeners = this._listeners.filter((entry) => !entry.once);
    toCall.forEach((entry) => entry.listener(new Event('change')));
  }
}

export class FakeWindow {
  dispatchedEvents: Event[] = [];
  mediaQueries: FakeMediaQueryList[] = [];

  constructor(public devicePixelRatio: number) {}

  dispatchEvent(event: Event): boolean {
    this.dispatchedEvents.push(event);
    return true;
  }

  matchMedia(query: string): FakeMediaQueryList {
    const mediaQueryList: FakeMediaQueryList = new FakeMediaQueryList(query);
    this.mediaQueries.push(mediaQueryList);
    return mediaQueryList;
  }

  get lastMediaQuery(): FakeMediaQueryList | undefined {
    return this.mediaQueries[this.mediaQueries.length - 1];
  }
}

export class FakeDocument {
  body: { style: Partial<CSSStyleDeclaration> } = { style: {} };

  constructor(public defaultView: FakeWindow | null) {}

  /** The value to provide for Angular's DOCUMENT token */
  asDocument(): Document {
    return (this as unknown) as Document;
  }
}

export function createFakeDocument(devicePixelRatio: number): FakeDocument {
  return new FakeDocument(new FakeWindow(devicePixelRatio));
}

export function createFakeDocumentWithoutWindow(): FakeDocument {
  return new FakeDocument(null);
}
