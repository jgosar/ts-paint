import { vi } from 'vitest';
import {
  downloadFile,
  getFileNameWithoutExtension,
  getImageFileFormat,
  isAbortError,
  isFileSystemAccessSupported,
  isWritableImageFileName,
  readImageDataFromFile,
  readImageDataFromUrl,
  renderImageToBlob,
  showFileUploadDialog,
  showSaveFilePickerForImage,
  writeImageToFileHandle,
} from './image-file.helpers';
import { createImage } from './image.helpers';
import { ImageFileData } from '../types/base/image-file-data';
import { BLUE, RED, WHITE, isColor, setPixel } from '../../testing/image-test.helpers';
import { FakeFileHandle, createImageDataUrl, createImageFile } from '../../testing/file-system.fakes';

const PNG_MAGIC_BYTES: number[] = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC_BYTES: number[] = [0xff, 0xd8];

/** A small image with distinct pixels, so that a round trip through a file can be checked pixel by pixel */
function createMarkedImage(): ImageData {
  const image: ImageData = createImage(5, 4, WHITE);
  setPixel(image, { w: 0, h: 0 }, RED);
  setPixel(image, { w: 4, h: 3 }, BLUE);
  return image;
}

function expectMarkedImage(image: ImageData) {
  expect(image.width).toBe(5);
  expect(image.height).toBe(4);
  expect(isColor({ w: 0, h: 0 }, image, RED)).toBe(true);
  expect(isColor({ w: 4, h: 3 }, image, BLUE)).toBe(true);
  expect(isColor({ w: 2, h: 2 }, image, WHITE)).toBe(true);
}

function createPngFile(name: string = 'marked.png', type: string = 'image/png'): Promise<File> {
  return createImageFile(createMarkedImage(), name, type);
}

async function firstBytes(blob: Blob, count: number): Promise<number[]> {
  return Array.from(new Uint8Array(await blob.arrayBuffer()).slice(0, count));
}

function markedImageDataUrl(): string {
  return createImageDataUrl(createMarkedImage());
}

/** Swaps a window property for the duration of a test; returns the restore function */
function replaceWindowProperty(name: string, value: unknown): () => void {
  const original: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(window, name);
  Object.defineProperty(window, name, { configurable: true, writable: true, value });
  return () => {
    if (original) {
      Object.defineProperty(window, name, original);
    } else {
      delete (window as any)[name];
    }
  };
}

describe('getFileNameWithoutExtension', () => {
  it('strips the last extension', () => {
    expect(getFileNameWithoutExtension('photo.png')).toBe('photo');
    expect(getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
  });

  it('leaves names without an extension alone', () => {
    expect(getFileNameWithoutExtension('photo')).toBe('photo');
  });

  it('turns a dot file into an empty name', () => {
    expect(getFileNameWithoutExtension('.hidden')).toBe('');
  });
});

describe('getImageFileFormat', () => {
  it('recognises the extension regardless of case', () => {
    expect(getImageFileFormat('a.png')).toBe('png');
    expect(getImageFileFormat('a.PNG')).toBe('png');
    expect(getImageFileFormat('a.jpg')).toBe('jpeg');
    expect(getImageFileFormat('a.JPEG')).toBe('jpeg');
  });

  it('prefers the extension over the MIME type', () => {
    expect(getImageFileFormat('a.jpg', 'image/png')).toBe('jpeg');
  });

  it('falls back to the MIME type for unknown extensions', () => {
    expect(getImageFileFormat('a.gif', 'image/jpeg')).toBe('jpeg');
    expect(getImageFileFormat('noextension', 'image/png')).toBe('png');
  });

  it('falls back to png when neither is recognised', () => {
    expect(getImageFileFormat('a.gif', 'image/gif')).toBe('png');
    expect(getImageFileFormat('noextension')).toBe('png');
  });
});

describe('isWritableImageFileName', () => {
  it('is true for the formats the app can save', () => {
    expect(isWritableImageFileName('a.png')).toBe(true);
    expect(isWritableImageFileName('a.jpg')).toBe(true);
    expect(isWritableImageFileName('A.JPEG')).toBe(true);
  });

  it('is false for read only formats and missing extensions', () => {
    expect(isWritableImageFileName('a.gif')).toBe(false);
    expect(isWritableImageFileName('a.bmp')).toBe(false);
    expect(isWritableImageFileName('a.webp')).toBe(false);
    expect(isWritableImageFileName('a')).toBe(false);
  });
});

describe('isAbortError', () => {
  it('is true only for a DOMException named AbortError', () => {
    expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true);
    expect(isAbortError(new DOMException('denied', 'NotAllowedError'))).toBe(false);
    expect(isAbortError(new Error('AbortError'))).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});

describe('isFileSystemAccessSupported', () => {
  const restores: (() => void)[] = [];

  afterEach(() => {
    restores.splice(0).forEach((restore) => restore());
  });

  it('is true when both pickers are functions', () => {
    restores.push(replaceWindowProperty('showOpenFilePicker', () => {}));
    restores.push(replaceWindowProperty('showSaveFilePicker', () => {}));

    expect(isFileSystemAccessSupported()).toBe(true);
  });

  it('is false when either picker is missing', () => {
    restores.push(replaceWindowProperty('showOpenFilePicker', () => {}));
    restores.push(replaceWindowProperty('showSaveFilePicker', undefined));
    expect(isFileSystemAccessSupported()).toBe(false);

    restores.push(replaceWindowProperty('showOpenFilePicker', undefined));
    restores.push(replaceWindowProperty('showSaveFilePicker', () => {}));
    expect(isFileSystemAccessSupported()).toBe(false);
  });
});

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function captureDownload(fileData: ImageFileData): HTMLAnchorElement {
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });

    downloadFile(fileData);

    expect(clicked.length).toBe(1);
    return clicked[0];
  }

  it('clicks a link that downloads the image as a PNG', () => {
    const link: HTMLAnchorElement = captureDownload({
      imageData: createMarkedImage(),
      fileName: 'drawing',
      fileFormat: 'png',
    });

    expect(link.download).toBe('drawing.png');
    expect(link.href.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('uses the jpg extension and MIME type for JPEG', () => {
    const link: HTMLAnchorElement = captureDownload({
      imageData: createMarkedImage(),
      fileName: 'drawing',
      fileFormat: 'jpeg',
    });

    expect(link.download).toBe('drawing.jpg');
    expect(link.href.startsWith('data:image/jpeg;base64,')).toBe(true);
  });
});

describe('renderImageToBlob', () => {
  const originalToBlob: typeof HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.toBlob;

  afterEach(() => {
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
  });

  it('encodes a PNG', async () => {
    const blob: Blob = await renderImageToBlob(createMarkedImage(), 'png');

    expect(blob.type).toBe('image/png');
    expect(await firstBytes(blob, 4)).toEqual(PNG_MAGIC_BYTES);
  });

  it('encodes a JPEG', async () => {
    const blob: Blob = await renderImageToBlob(createMarkedImage(), 'jpeg');

    expect(blob.type).toBe('image/jpeg');
    expect(await firstBytes(blob, 2)).toEqual(JPEG_MAGIC_BYTES);
  });

  it('rejects when the canvas cannot encode the image', async () => {
    HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
      callback(null);
    };

    await expect(renderImageToBlob(createMarkedImage(), 'png')).rejects.toThrow('Could not encode image as image/png');
  });
});

describe('writeImageToFileHandle', () => {
  it('writes the encoded image to the handle and closes the stream', async () => {
    const handle: FakeFileHandle = new FakeFileHandle('drawing.png');

    await writeImageToFileHandle(handle.asHandle(), createMarkedImage(), 'png');

    expect(handle.writable.write).toHaveBeenCalledTimes(1);
    const written: Blob = handle.writable.write.mock.calls[0][0];
    expect(written.type).toBe('image/png');
    expect(await firstBytes(written, 4)).toEqual(PNG_MAGIC_BYTES);
    expect(handle.writable.close).toHaveBeenCalledTimes(1);
  });

  it('closes the stream and rethrows when writing fails', async () => {
    const handle: FakeFileHandle = new FakeFileHandle('drawing.png');
    handle.writable.write.mockRejectedValue(new Error('disk full'));

    await expect(writeImageToFileHandle(handle.asHandle(), createMarkedImage(), 'png')).rejects.toThrow('disk full');

    expect(handle.writable.close).toHaveBeenCalledTimes(1);
  });
});

describe('showSaveFilePickerForImage', () => {
  let restore: () => void;
  let picker: ReturnType<typeof vi.fn>;
  const handle: FileSystemFileHandle = new FakeFileHandle('drawing.png').asHandle();

  beforeEach(() => {
    picker = vi.fn().mockResolvedValue(handle);
    restore = replaceWindowProperty('showSaveFilePicker', picker);
  });

  afterEach(() => {
    restore();
  });

  it('resolves with the handle chosen in the picker', async () => {
    expect(await showSaveFilePickerForImage('drawing', 'png')).toBe(handle);
  });

  it('suggests the file name with the extension of the format', async () => {
    await showSaveFilePickerForImage('drawing', 'jpeg');

    expect(picker.mock.calls[0][0].suggestedName).toBe('drawing.jpg');
  });

  it('lists the current format first and the others after it', async () => {
    await showSaveFilePickerForImage('drawing', 'jpeg');

    const options: SaveFilePickerOptions = picker.mock.calls[0][0];
    expect(options.types.map((type) => type.description)).toEqual(['JPEG image', 'PNG image']);
    expect(options.types[0].accept).toEqual({ 'image/jpeg': ['.jpg', '.jpeg'] });
    expect(options.types[1].accept).toEqual({ 'image/png': ['.png'] });
  });

  it('lists png first when png is the current format', async () => {
    await showSaveFilePickerForImage('drawing', 'png');

    expect(picker.mock.calls[0][0].types.map((type) => type.description)).toEqual(['PNG image', 'JPEG image']);
  });

  it('excludes the "all files" option so the browser appends a matching extension', async () => {
    await showSaveFilePickerForImage('drawing', 'png');

    expect(picker.mock.calls[0][0].excludeAcceptAllOption).toBe(true);
  });
});

describe('showFileUploadDialog', () => {
  const restores: (() => void)[] = [];

  afterEach(() => {
    restores.splice(0).forEach((restore) => restore());
    vi.restoreAllMocks();
  });

  describe('with the File System Access API', () => {
    function stubOpenPicker(handle: FileSystemFileHandle): ReturnType<typeof vi.fn> {
      const picker = vi.fn().mockResolvedValue([handle]);
      restores.push(replaceWindowProperty('showOpenFilePicker', picker));
      restores.push(replaceWindowProperty('showSaveFilePicker', () => {}));
      return picker;
    }

    async function handleForPngFile(name: string, type?: string): Promise<FileSystemFileHandle> {
      return new FakeFileHandle(name, 'file', await createPngFile(name, type)).asHandle();
    }

    it('reads the picked file and keeps its handle for a writable format', async () => {
      const handle: FileSystemFileHandle = await handleForPngFile('picked.png');
      stubOpenPicker(handle);

      const result: ImageFileData = await showFileUploadDialog();

      expectMarkedImage(result.imageData);
      expect(result.fileName).toBe('picked');
      expect(result.fileFormat).toBe('png');
      expect(result.fileHandle).toBe(handle);
    });

    it('drops the handle for a read only format', async () => {
      const handle: FileSystemFileHandle = await handleForPngFile('animation.gif', 'image/gif');
      stubOpenPicker(handle);

      const result: ImageFileData = await showFileUploadDialog();

      expectMarkedImage(result.imageData);
      expect(result.fileName).toBe('animation');
      expect(result.fileFormat).toBe('png');
      expect(result.fileHandle).toBeUndefined();
    });

    it('offers every readable image extension in the picker', async () => {
      const picker = stubOpenPicker(await handleForPngFile('marked.png'));

      await showFileUploadDialog();

      const options: OpenFilePickerOptions = picker.mock.calls[0][0];
      expect(options.types.length).toBe(1);
      expect(options.types[0].accept['image/*']).toEqual(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']);
    });

    it('rejects when the picker is cancelled', async () => {
      const abort: DOMException = new DOMException('cancelled', 'AbortError');
      restores.push(replaceWindowProperty('showOpenFilePicker', vi.fn().mockRejectedValue(abort)));
      restores.push(replaceWindowProperty('showSaveFilePicker', () => {}));

      await expect(showFileUploadDialog()).rejects.toBe(abort);
    });
  });

  describe('without the File System Access API', () => {
    function stubFileInput(): { clicked: HTMLInputElement[] } {
      restores.push(replaceWindowProperty('showOpenFilePicker', undefined));
      const clicked: HTMLInputElement[] = [];
      vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
        clicked.push(this);
      });
      return { clicked };
    }

    it('opens a hidden file input and reads the chosen file', async () => {
      const { clicked } = stubFileInput();
      const file: File = await createPngFile('chosen.jpg', 'image/jpeg');

      const pending: Promise<ImageFileData> = showFileUploadDialog();

      expect(clicked.length).toBe(1);
      expect(clicked[0].type).toBe('file');
      clicked[0].onchange({ target: { files: [file] } } as any);
      const result: ImageFileData = await pending;

      expectMarkedImage(result.imageData);
      expect(result.fileName).toBe('chosen');
      expect(result.fileFormat).toBe('jpeg');
      expect(result.fileHandle).toBeUndefined();
    });

    it('rejects when the chosen file is not an image', async () => {
      const { clicked } = stubFileInput();
      const file: File = new File(['definitely not an image'], 'notes.txt', { type: 'text/plain' });

      const pending: Promise<ImageFileData> = showFileUploadDialog();
      clicked[0].onchange({ target: { files: [file] } } as any);

      await expect(pending).rejects.toBe('Something went wrong, are you sure you pasted an image?');
    });
  });
});

describe('readImageDataFromFile', () => {
  it('reads back the pixels of an image that was rendered to a file', async () => {
    const original: ImageData = createMarkedImage();
    const file: File = new File([await renderImageToBlob(original, 'png')], 'marked.png', { type: 'image/png' });

    const read: ImageData = await readImageDataFromFile(file);

    expectMarkedImage(read);
    expect(read.data).toEqual(original.data);
  });

  it('rejects for a file that is not an image', async () => {
    const file: File = new File(['nope'], 'nope.png', { type: 'image/png' });

    await expect(readImageDataFromFile(file)).rejects.toBe('Something went wrong, are you sure you pasted an image?');
  });
});

describe('readImageDataFromUrl', () => {
  const originalImage: typeof Image = window.Image;
  const realSrcSetter: (value: string) => void = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;

  afterEach(() => {
    window.Image = originalImage;
  });

  /** Replaces `Image` so that no URL is fetched: sources that `fails` rejects raise onerror, every other source
   * is silently redirected to a data URL of the marked image. Returns the list of requested sources. */
  function stubImageLoading(fails: (src: string) => boolean): string[] {
    const requested: string[] = [];
    const dataUrl: string = markedImageDataUrl();
    window.Image = (function () {
      const image: HTMLImageElement = document.createElement('img');
      Object.defineProperty(image, 'src', {
        configurable: true,
        get: () => requested[requested.length - 1],
        set: (value: string) => {
          requested.push(value);
          if (fails(value)) {
            setTimeout(() => image.onerror(new Event('error')));
          } else {
            realSrcSetter.call(image, dataUrl);
          }
        },
      });
      return image;
    } as unknown) as typeof Image;
    return requested;
  }

  it('decodes a data URL', async () => {
    const read: ImageData = await readImageDataFromUrl(markedImageDataUrl());

    expectMarkedImage(read);
  });

  it('rejects for a data URL that is not an image, without retrying through the proxy', async () => {
    const requested: string[] = stubImageLoading(() => true);

    await expect(readImageDataFromUrl('data:text/plain;base64,bm9wZQ==')).rejects.toBe(
      'Something went wrong, are you sure you pasted an image?'
    );
    expect(requested.length).toBe(1);
  });

  it('loads a web URL directly when its host allows it', async () => {
    const requested: string[] = stubImageLoading(() => false);

    const read: ImageData = await readImageDataFromUrl('https://images.example/pic.png');

    expectMarkedImage(read);
    expect(requested).toEqual(['https://images.example/pic.png']);
  });

  it('retries through the CORS proxy when the direct load of a web URL fails', async () => {
    const url: string = 'https://no-cors.example/pic.png?size=big&v=2';
    const requested: string[] = stubImageLoading((src) => src === url);

    const read: ImageData = await readImageDataFromUrl(url);

    expectMarkedImage(read);
    expect(requested.length).toBe(2);
    expect(requested[1]).toBe('https://images.weserv.nl/?output=png&url=' + encodeURIComponent(url));
  });

  it('rejects when the proxy load fails as well', async () => {
    const requested: string[] = stubImageLoading(() => true);

    await expect(readImageDataFromUrl('http://no-cors.example/pic.png')).rejects.toBe(
      'Something went wrong, are you sure you pasted an image?'
    );
    expect(requested.length).toBe(2);
  });

  it('sets crossOrigin before the source so that the canvas is not tainted', async () => {
    const requested: string[] = stubImageLoading(() => false);
    let crossOriginWhenSrcWasSet: string | undefined;
    const previousImage: typeof Image = window.Image;
    window.Image = (function () {
      const image: HTMLImageElement = new previousImage();
      const srcDescriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(image, 'src');
      Object.defineProperty(image, 'src', {
        ...srcDescriptor,
        set: (value: string) => {
          crossOriginWhenSrcWasSet = image.crossOrigin;
          srcDescriptor.set(value);
        },
      });
      return image;
    } as unknown) as typeof Image;

    await readImageDataFromUrl('https://images.example/pic.png');

    expect(crossOriginWhenSrcWasSet).toBe('anonymous');
    expect(requested.length).toBe(1);
  });
});
