/**
 * Factories for the DOM events the components react to. They build real events wherever Chromium lets a test
 * populate them from script and fall back to stubs typed as the event otherwise (see each factory's comment).
 */

export interface KeyEventOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  /**
   * Forces `event.target`, for handlers that are called directly instead of through `dispatchEvent` and read the
   * target (e.g. the text selection of an input). A forced target survives dispatching too.
   */
  target?: EventTarget;
}

function keyboardEvent(type: 'keydown' | 'keyup', key: string, options: KeyEventOptions): KeyboardEvent {
  const event: KeyboardEvent = new KeyboardEvent(type, {
    key,
    ctrlKey: !!options.ctrl,
    shiftKey: !!options.shift,
    altKey: !!options.alt,
    metaKey: !!options.meta,
    bubbles: true,
    cancelable: true,
  });
  if (options.target) {
    Object.defineProperty(event, 'target', { value: options.target, configurable: true });
  }
  return event;
}

export function keydown(key: string, options: KeyEventOptions = {}): KeyboardEvent {
  return keyboardEvent('keydown', key, options);
}

export function keyup(key: string, options: KeyEventOptions = {}): KeyboardEvent {
  return keyboardEvent('keyup', key, options);
}

/** A small file that looks like an image to anything that only inspects its name and MIME type */
export function createTestFile(name: string = 'picture.png', type: string = 'image/png'): File {
  return new File(['not really an image'], name, { type });
}

/** Minimal stand-in for a FileSystemFileHandle, which Chromium only hands out for real files */
export function createFileHandleStub(file: File): FileSystemFileHandle {
  return ({ kind: 'file', name: file.name, getFile: () => Promise.resolve(file) } as unknown) as FileSystemFileHandle;
}

/** A real paste event whose clipboard holds `file` as its first item */
export function pasteEventWithFile(file: File): ClipboardEvent {
  const clipboardData: DataTransfer = new DataTransfer();
  clipboardData.items.add(file);
  return new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
}

/** A real paste event whose clipboard holds `text` as 'text/plain' */
export function pasteEventWithText(text: string): ClipboardEvent {
  const clipboardData: DataTransfer = new DataTransfer();
  clipboardData.setData('text/plain', text);
  return new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
}

export function dragEvent(type: 'dragenter' | 'dragover' | 'dragleave' | 'drop'): DragEvent {
  return new DragEvent(type, { bubbles: true, cancelable: true });
}

/**
 * A real drop event carrying `file`. Its `dataTransfer` is a stub: Chromium creates a fresh DataTransferItem
 * wrapper on every `items[i]` access, so `getAsFileSystemHandle` (which only works for real drags) cannot be
 * controlled on a real DataTransfer.
 * - `handle` given: the item offers `getAsFileSystemHandle()` resolving to it (pass a rejected promise to simulate
 *   a failure)
 * - `handle` omitted: the item has no `getAsFileSystemHandle`, like browsers without the File System Access API
 */
export function dropEventWithFile(
  file: File,
  handle?: FileSystemHandle | null | Promise<FileSystemHandle | null>
): DragEvent {
  const item: Partial<DataTransferItem> = { kind: 'file', type: file.type, getAsFile: () => file };
  if (handle !== undefined) {
    item.getAsFileSystemHandle = () => Promise.resolve(handle);
  }
  const event: DragEvent = dragEvent('drop');
  Object.defineProperty(event, 'dataTransfer', { value: { items: [item], files: [file] }, configurable: true });
  return event;
}

export interface EventRecorder {
  /** Events of the requested type that reached the target, in order */
  readonly events: Event[];
  /** Removes the listener; call it when the test is done */
  stop(): void;
}

/**
 * Records the events of `type` that reach `target`, to tell whether an event dispatched on a descendant
 * propagated past the component under test.
 */
export function recordEvents(target: EventTarget, type: string): EventRecorder {
  const events: Event[] = [];
  const listener: (event: Event) => void = (event) => events.push(event);
  target.addEventListener(type, listener);
  return { events, stop: () => target.removeEventListener(type, listener) };
}

/** Sets the text of an input the way the user would, so that ngModel / (input) bindings pick it up */
export function setInputText(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Resolves after the pending `setTimeout(..., 0)` callbacks have run. Used instead of fakeAsync/tick, which need a
 * ProxyZone that the Vitest runner does not install.
 */
export function afterTimeout(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
