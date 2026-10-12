import { Page } from '@playwright/test';

/**
 * Replaces the File System Access API with in-page fakes. Opened files come from `openFileBytes` (base64 PNG), and
 * everything written to a handle is kept in `window.__savedFiles` as { name, base64 }.
 */
export async function installFileSystemAccessFake(
  page: Page,
  openFile?: { name: string; bytes: Buffer }
): Promise<void> {
  await page.addInitScript(
    ({ name, base64 }) => {
      const w: any = window;
      w.__savedFiles = [];
      const toBase64 = async (blob: Blob): Promise<string> => {
        const bytes: Uint8Array = new Uint8Array(await blob.arrayBuffer());
        let binary: string = '';
        bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
        return btoa(binary);
      };
      w.__makeHandle = (handleName: string, file?: File) => ({
        kind: 'file',
        name: handleName,
        getFile: async () => file,
        createWritable: async () => {
          const parts: Blob[] = [];
          return {
            write: async (data: Blob) => {
              parts.push(data);
            },
            close: async () => {
              w.__savedFiles.push({ name: handleName, base64: await toBase64(new Blob(parts)) });
            },
          };
        },
      });
      if (name) {
        const binary: string = atob(base64);
        const bytes: Uint8Array<ArrayBuffer> = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        w.__openFile = new File([bytes], name, { type: 'image/png' });
      }
      w.showOpenFilePicker = async () => [w.__makeHandle(w.__openFile.name, w.__openFile)];
      w.showSaveFilePicker = async (options: { suggestedName: string }) => w.__makeHandle(options.suggestedName);
    },
    { name: openFile?.name, base64: openFile?.bytes.toString('base64') }
  );
}

/** Removes the File System Access API so the app falls back to downloads and the Save As window */
export async function removeFileSystemAccess(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w: any = window;
    w.showOpenFilePicker = undefined;
    w.showSaveFilePicker = undefined;
  });
}

export async function savedFiles(page: Page): Promise<{ name: string; bytes: Buffer }[]> {
  const files: { name: string; base64: string }[] = await page.evaluate(() => (window as any).__savedFiles);
  return files.map((file) => ({ name: file.name, bytes: Buffer.from(file.base64, 'base64') }));
}

/** Installs a fake `window.launchQueue` ("Open with TS Paint"); call `launchFile` afterwards to deliver a file */
export async function installLaunchQueueFake(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w: any = window;
    // Chromium exposes a native, read-only window.launchQueue, so it has to be redefined rather than assigned
    Object.defineProperty(w, 'launchQueue', {
      configurable: true,
      value: { setConsumer: (consumer: (params: unknown) => void) => (w.__launchConsumer = consumer) },
    });
  });
}

export async function launchFile(page: Page, name: string, bytes: Buffer): Promise<void> {
  await page.evaluate(
    ({ fileName, base64 }) => {
      const w: any = window;
      const binary: string = atob(base64);
      const data: Uint8Array<ArrayBuffer> = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const file: File = new File([data], fileName, { type: 'image/png' });
      // Returned so that a failure inside the app's consumer fails the test instead of being swallowed
      return w.__launchConsumer({ files: [w.__makeHandle(fileName, file)] });
    },
    { fileName: name, base64: bytes.toString('base64') }
  );
}

function fileFromBytesScript(): string {
  return `(name, base64) => { const b = atob(base64); return new File([Uint8Array.from(b, c => c.charCodeAt(0))], name, { type: 'image/png' }); }`;
}

/** Dispatches a synthetic paste event carrying a PNG file (what Ctrl+V with an image on the clipboard does) */
export async function pasteFile(page: Page, name: string, bytes: Buffer): Promise<void> {
  await page.evaluate(
    ({ fileName, base64, makeFile }) => {
      const file: File = new Function('return ' + makeFile)()(fileName, base64);
      const transfer: DataTransfer = new DataTransfer();
      transfer.items.add(file);
      document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true }));
    },
    { fileName: name, base64: bytes.toString('base64'), makeFile: fileFromBytesScript() }
  );
}

/** Drops a PNG file onto the app, the way a file dragged from the desktop arrives */
export async function dropFile(page: Page, name: string, bytes: Buffer): Promise<void> {
  await page.evaluate(
    ({ fileName, base64, makeFile }) => {
      const file: File = new Function('return ' + makeFile)()(fileName, base64);
      const transfer: DataTransfer = new DataTransfer();
      transfer.items.add(file);
      const target: Element = document.querySelector('tsp-ts-paint');
      target.dispatchEvent(new DragEvent('dragover', { dataTransfer: transfer, bubbles: true, cancelable: true }));
      target.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    },
    { fileName: name, base64: bytes.toString('base64'), makeFile: fileFromBytesScript() }
  );
}
