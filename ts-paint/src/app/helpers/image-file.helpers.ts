import { ImageFileData } from '../types/base/image-file-data';
import { loadImageToCanvas } from './canvas.helpers';

export function downloadImage(fileData: ImageFileData) {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const downloadLink: HTMLAnchorElement = document.createElement("a");
  loadImageToCanvas(fileData.imageData, canvas);
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.download = fileData.fileName + '.png';
  downloadLink.click();
}
