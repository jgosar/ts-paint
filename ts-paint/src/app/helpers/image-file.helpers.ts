import { ImageFileData } from '../types/base/image-file-data';
import {
  DEFAULT_IMAGE_FILE_FORMAT,
  IMAGE_FILE_FORMAT_INFO,
  IMAGE_FILE_FORMATS,
  ImageFileFormat,
} from '../types/base/image-file-format';
import { loadImageToCanvas } from './canvas.helpers';

// Public image proxy that adds CORS headers, used only when the image's own host refuses a direct cross-origin load.
// output=png keeps the pixels lossless.
const CORS_PROXY_URL: string = 'https://images.weserv.nl/?output=png&url=';

// Formats the browser can decode and the app can open, but cannot save back to.
const READ_ONLY_IMAGE_EXTENSIONS: string[] = ['gif', 'bmp', 'webp'];

const OPEN_PICKER_ACCEPT_TYPE: FilePickerAcceptType = {
  description: 'Images',
  accept: {
    'image/*': [
      ...IMAGE_FILE_FORMATS.flatMap((format) => IMAGE_FILE_FORMAT_INFO[format].extensions),
      ...READ_ONLY_IMAGE_EXTENSIONS,
    ].map((extension) => '.' + extension),
  },
};

function getPickerAcceptType(format: ImageFileFormat): FilePickerAcceptType {
  const { description, mimeType, extensions } = IMAGE_FILE_FORMAT_INFO[format];
  return { description, accept: { [mimeType]: extensions.map((extension) => '.' + extension) } };
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window.showOpenFilePicker === 'function' && typeof window.showSaveFilePicker === 'function';
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function downloadFile(fileData: ImageFileData) {
  const { extension, mimeType, quality } = IMAGE_FILE_FORMAT_INFO[fileData.fileFormat];
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const downloadLink: HTMLAnchorElement = document.createElement('a');
  loadImageToCanvas(fileData.imageData, canvas);
  downloadLink.href = canvas.toDataURL(mimeType, quality);
  downloadLink.download = fileData.fileName + '.' + extension;
  downloadLink.click();
}

export function renderImageToBlob(imageData: ImageData, format: ImageFileFormat): Promise<Blob> {
  const { mimeType, quality } = IMAGE_FILE_FORMAT_INFO[format];
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  loadImageToCanvas(imageData, canvas);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) => (blob ? resolve(blob) : reject(new Error('Could not encode image as ' + mimeType))),
      mimeType,
      quality
    );
  });
}

export async function writeImageToFileHandle(
  handle: FileSystemFileHandle,
  imageData: ImageData,
  format: ImageFileFormat
): Promise<void> {
  const blob: Blob = await renderImageToBlob(imageData, format);
  const writable: FileSystemWritableFileStream = await handle.createWritable();
  try {
    await writable.write(blob);
  } finally {
    await writable.close();
  }
}

export function showSaveFilePickerForImage(fileName: string, format: ImageFileFormat): Promise<FileSystemFileHandle> {
  // Current format first, as the picker preselects the first type
  const formats: ImageFileFormat[] = [format, ...IMAGE_FILE_FORMATS.filter((other) => other !== format)];

  return window.showSaveFilePicker({
    suggestedName: fileName + '.' + IMAGE_FILE_FORMAT_INFO[format].extension,
    types: formats.map(getPickerAcceptType),
    excludeAcceptAllOption: true, // the browser then appends a matching extension, so the saved bytes match the name
  });
}

export function showFileUploadDialog(): Promise<ImageFileData> {
  if (isFileSystemAccessSupported()) {
    return showFileOpenPicker();
  }

  return new Promise<ImageFileData>((resolve, reject) => {
    const fileInput: HTMLInputElement = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (fileUploadEvent: any) => {
      const uploadedFile: File = fileUploadEvent.target.files[0];
      const fileName: string = getFileNameWithoutExtension(uploadedFile.name);
      const fileFormat: ImageFileFormat = getImageFileFormat(uploadedFile.name, uploadedFile.type);
      getImageDataFromUpload(
        uploadedFile,
        (imageData: ImageData) => {
          resolve({ imageData, fileName, fileFormat });
        },
        reject
      );
    };
    fileInput.click();
  });
}

async function showFileOpenPicker(): Promise<ImageFileData> {
  const [fileHandle] = await window.showOpenFilePicker({ types: [OPEN_PICKER_ACCEPT_TYPE] });
  const file: File = await fileHandle.getFile();
  const imageData: ImageData = await readImageDataFromFile(file);

  return {
    imageData,
    fileName: getFileNameWithoutExtension(file.name),
    fileFormat: getImageFileFormat(file.name, file.type),
    // Only keep the handle for formats we can save back to; otherwise Save falls through to the save picker.
    fileHandle: isWritableImageFileName(file.name) ? fileHandle : undefined,
  };
}

export function readImageDataFromFile(imageFile: File): Promise<ImageData> {
  return new Promise<ImageData>((resolve, reject) => {
    getImageDataFromUpload(imageFile, resolve, reject);
  });
}

export function readImageDataFromUrl(imageUrl: string): Promise<ImageData> {
  return new Promise<ImageData>((resolve, reject) => {
    loadImageFromUrl(imageUrl, resolve, reject);
  });
}

export function getFileNameWithoutExtension(fileName: string): string {
  if (fileName.includes('.')) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'));
  }

  return fileName;
}

export function getImageFileFormat(fileName: string, mimeType?: string): ImageFileFormat {
  return (
    getImageFileFormatByExtension(fileName) ??
    IMAGE_FILE_FORMATS.find((format) => IMAGE_FILE_FORMAT_INFO[format].mimeType === mimeType) ??
    DEFAULT_IMAGE_FILE_FORMAT
  );
}

// True when the file's extension belongs to a format the app can write back, so that saving to its handle
// does not put bytes of a different format into e.g. a .gif file.
export function isWritableImageFileName(fileName: string): boolean {
  return getImageFileFormatByExtension(fileName) !== undefined;
}

function getImageFileFormatByExtension(fileName: string): ImageFileFormat | undefined {
  const extension: string = getFileExtension(fileName);
  return IMAGE_FILE_FORMATS.find((format) => IMAGE_FILE_FORMAT_INFO[format].extensions.includes(extension));
}

function getFileExtension(fileName: string): string {
  return fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase() : '';
}

function getImageDataFromUpload(
  uploadedFile: File,
  callback: (imageData: ImageData) => void,
  errorCallback: (reason: string) => void
) {
  const fileReader: FileReader = new FileReader();

  fileReader.onload = (progress: any) => {
    const imgUrl: string = progress.target.result as string; // TODO: What if this is an ArrayBuffer?

    loadImageFromUrl(imgUrl, callback, errorCallback);
  };

  fileReader.readAsDataURL(uploadedFile);
}

function loadImageFromUrl(
  imgUrl: string,
  callback: (imageData: ImageData) => void,
  errorCallback: (reason: string) => void
) {
  loadImage(imgUrl)
    .catch((error: unknown) => {
      // A web URL fails the direct load when its host does not send CORS headers; retry through the proxy
      if (imgUrl.startsWith('http')) {
        return loadImage(CORS_PROXY_URL + encodeURIComponent(imgUrl));
      }
      throw error;
    })
    .then(
      (image: HTMLImageElement) => callback(getImageDataFromImage(image)),
      () => errorCallback('Something went wrong, are you sure you pasted an image?')
    );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image: HTMLImageElement = new Image();
    image.crossOrigin = 'anonymous'; // Must be set before src, otherwise the canvas gets tainted
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image from ' + src));
    image.src = src;
  });
}

function getImageDataFromImage(image: HTMLImageElement): ImageData {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context: CanvasRenderingContext2D = canvas.getContext('2d');
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}
