import { ImageFileData } from '../types/base/image-file-data';
import { ImageFileFormat } from '../types/base/image-file-format';
import { loadImageToCanvas } from './canvas.helpers';

const CORS__PROXY_URL: string = 'https://cors-anywhere.herokuapp.com/';

const IMAGE_FILE_FORMAT_INFO: Record<ImageFileFormat, { extension: string; mimeType: string; quality?: number }> = {
  png: { extension: 'png', mimeType: 'image/png' },
  jpeg: { extension: 'jpg', mimeType: 'image/jpeg', quality: 0.9 },
};

export function saveFile(fileData: ImageFileData, format: ImageFileFormat = 'png') {
  const { extension, mimeType, quality } = IMAGE_FILE_FORMAT_INFO[format];
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
      getImageDataFromUpload(
        uploadedFile,
        (imageData: ImageData) => {
          resolve({ imageData, fileName });
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
