import { ImageFileData } from '../types/base/image-file-data';
import { ImageFileFormat } from '../types/base/image-file-format';
import { loadImageToCanvas } from './canvas.helpers';

const CORS__PROXY_URL: string = 'https://cors-anywhere.herokuapp.com/';

const IMAGE_FILE_FORMAT_INFO: Record<ImageFileFormat, { extension: string; mimeType: string; quality?: number }> = {
  png: { extension: 'png', mimeType: 'image/png' },
  jpeg: { extension: 'jpg', mimeType: 'image/jpeg', quality: 0.9 },
};

const IMAGE_PICKER_ACCEPT_TYPES: Record<ImageFileFormat, FilePickerAcceptType> = {
  png: { description: 'PNG image', accept: { 'image/png': ['.png'] } },
  jpeg: { description: 'JPEG image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
};

const OPEN_PICKER_ACCEPT_TYPE: FilePickerAcceptType = {
  description: 'Images',
  accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'] },
};

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
  const otherFormat: ImageFileFormat = format === 'png' ? 'jpeg' : 'png';

  return window.showSaveFilePicker({
    suggestedName: fileName + '.' + IMAGE_FILE_FORMAT_INFO[format].extension,
    types: [IMAGE_PICKER_ACCEPT_TYPES[format], IMAGE_PICKER_ACCEPT_TYPES[otherFormat]],
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
    fileHandle,
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
  const extension: string = fileName.includes('.')
    ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
    : '';
  if (mimeType === IMAGE_FILE_FORMAT_INFO.jpeg.mimeType || ['jpg', 'jpeg'].includes(extension)) {
    return 'jpeg';
  }

  return 'png';
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
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const image: HTMLImageElement = new Image();

  if (imgUrl.startsWith('http')) {
    image.src = CORS__PROXY_URL + imgUrl; // It's a web URL, so we need to access it through a proxy to avoid CORS errors
  } else {
    image.src = imgUrl; // It's a data URL, so we can access it directly
  }

  image.setAttribute('crossOrigin', '');
  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    const imageData: ImageData = context.getImageData(0, 0, image.width, image.height);
    callback(imageData);
  };
  image.onerror = () => {
    errorCallback('Something went wrong, are you sure you pasted an image?');
  };
}
