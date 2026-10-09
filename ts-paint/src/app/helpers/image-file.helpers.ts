import { ImageFileData } from '../types/base/image-file-data';
import { ImageFileFormat } from '../types/base/image-file-format';
import { loadImageToCanvas } from './canvas.helpers';

// Public image proxy that adds CORS headers, used only when the image's own host refuses a direct cross-origin load.
// output=png keeps the pixels lossless.
const CORS_PROXY_URL: string = 'https://images.weserv.nl/?output=png&url=';

const IMAGE_FILE_FORMAT_INFO: Record<ImageFileFormat, { extension: string; mimeType: string; quality?: number }> = {
  png: { extension: 'png', mimeType: 'image/png' },
  jpeg: { extension: 'jpg', mimeType: 'image/jpeg', quality: 0.9 },
};

export function saveFile(fileData: ImageFileData) {
  const { extension, mimeType, quality } = IMAGE_FILE_FORMAT_INFO[fileData.fileFormat];
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const downloadLink: HTMLAnchorElement = document.createElement('a');
  loadImageToCanvas(fileData.imageData, canvas);
  downloadLink.href = canvas.toDataURL(mimeType, quality);
  downloadLink.download = fileData.fileName + '.' + extension;
  downloadLink.click();
}

export function showFileUploadDialog(): Promise<ImageFileData> {
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
