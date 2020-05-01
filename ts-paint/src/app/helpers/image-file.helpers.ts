import { ImageFileData } from '../types/base/image-file-data';
import { loadImageToCanvas } from './canvas.helpers';

export function saveFile(fileData: ImageFileData) {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const downloadLink: HTMLAnchorElement = document.createElement("a");
  loadImageToCanvas(fileData.imageData, canvas);
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.download = fileData.fileName + '.png';
  downloadLink.click();
}

export function openFile(): Promise<ImageFileData> {
  return new Promise<ImageFileData>((resolve, reject) => {
    const fileInput: HTMLInputElement = document.createElement("input");
    fileInput.type = "file";
    fileInput.onchange = (fileUploadEvent: any) => {
      const uploadedFile: File = fileUploadEvent.target.files[0];
      const fileName: string = getFileNameWithoutExtension(uploadedFile.name);
      getImageDataFromUpload(uploadedFile, (imageData: ImageData) => {
        resolve({ imageData, fileName });
      }, reject);
    };
    fileInput.click();
  });
}

export function pasteFile(pastedFile: File): Promise<ImageData> {
  return new Promise<ImageData>((resolve, reject) => {
    getImageDataFromUpload(pastedFile, resolve, reject);
  });
}

function getFileNameWithoutExtension(fileName: string): string {
  if (fileName.includes('.')) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'));
  }

  return fileName;
}

function getImageDataFromUpload(uploadedFile: File, callback: (imageData: ImageData) => void, errorCallback: (reason: string) => void) {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const fileReader: FileReader = new FileReader();

  fileReader.onload = (progress: any) => {
    const imgUrl: string = <string>progress.target.result; // TODO: What if this is an ArrayBuffer?

    var image: HTMLImageElement = new Image;
    image.src = imgUrl;
    image.onload = (e: Event) => {
      canvas.width = image.width;
      canvas.height = image.height;
      const context: CanvasRenderingContext2D = canvas.getContext('2d');
      context.drawImage(image, 0, 0);

      var imageData: ImageData = context.getImageData(0, 0, image.width, image.height);
      callback(imageData);
    };
    image.onerror = () => {
      errorCallback('Something went wrong, are you sure you pasted an image?')
    }
  };

  fileReader.readAsDataURL(uploadedFile);
}
