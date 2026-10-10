import { Mock, vi } from 'vitest';
import { loadImageToCanvas } from '../app/helpers/canvas.helpers';

/** Encodes the image as a real PNG File, which FileReader and Image can decode */
export function createImageFile(image: ImageData, fileName: string, mimeType: string = 'image/png'): Promise<File> {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  loadImageToCanvas(image, canvas);
  return new Promise<File>((resolve) =>
    canvas.toBlob((blob: Blob) => resolve(new File([blob], fileName, { type: mimeType })), 'image/png')
  );
}

/** A PNG data URL of the image, loadable through Image.src */
export function createImageDataUrl(image: ImageData): string {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  loadImageToCanvas(image, canvas);
  return canvas.toDataURL('image/png');
}

export class FakeWritableStream {
  write = vi.fn((_data: Blob) => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

/** Enough of a FileSystemFileHandle for the store: a name, a kind, a file to read and a writable stream to write to */
export class FakeFileHandle {
  readonly writable: FakeWritableStream = new FakeWritableStream();
  /** Set to make createWritable() reject, e.g. with an AbortError or a permission error */
  createWritableError: unknown = undefined;

  constructor(public name: string, public kind: 'file' | 'directory' = 'file', private _file?: File) {}

  getFile(): Promise<File> {
    return Promise.resolve(this._file);
  }

  createWritable(): Promise<FakeWritableStream> {
    return this.createWritableError !== undefined
      ? Promise.reject(this.createWritableError)
      : Promise.resolve(this.writable);
  }

  asHandle(): FileSystemFileHandle {
    return (this as unknown) as FileSystemFileHandle;
  }
}

export function createAbortError(): DOMException {
  return new DOMException('The user aborted a request.', 'AbortError');
}

interface FileSystemAccessWindow {
  showOpenFilePicker?: (...args: unknown[]) => Promise<unknown>;
  showSaveFilePicker?: (...args: unknown[]) => Promise<unknown>;
}

const fileSystemAccessWindow: FileSystemAccessWindow = (window as unknown) as FileSystemAccessWindow;
const originalPickers: FileSystemAccessWindow = {
  showOpenFilePicker: fileSystemAccessWindow.showOpenFilePicker,
  showSaveFilePicker: fileSystemAccessWindow.showSaveFilePicker,
};

type PickerMock = Mock<(...args: unknown[]) => Promise<unknown>>;

export interface FileSystemAccessStubs {
  showOpenFilePicker: PickerMock;
  showSaveFilePicker: PickerMock;
}

/** Replaces the File System Access pickers with mocks (resolving to nothing until told otherwise) */
export function stubFileSystemAccess(): FileSystemAccessStubs {
  const stubs: FileSystemAccessStubs = {
    showOpenFilePicker: vi.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve([])),
    showSaveFilePicker: vi.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve(undefined)),
  };
  fileSystemAccessWindow.showOpenFilePicker = stubs.showOpenFilePicker;
  fileSystemAccessWindow.showSaveFilePicker = stubs.showSaveFilePicker;
  return stubs;
}

/** Makes isFileSystemAccessSupported() return false, as in browsers without the API */
export function removeFileSystemAccess(): void {
  fileSystemAccessWindow.showOpenFilePicker = undefined;
  fileSystemAccessWindow.showSaveFilePicker = undefined;
}

export function restoreFileSystemAccess(): void {
  fileSystemAccessWindow.showOpenFilePicker = originalPickers.showOpenFilePicker;
  fileSystemAccessWindow.showSaveFilePicker = originalPickers.showSaveFilePicker;
}
