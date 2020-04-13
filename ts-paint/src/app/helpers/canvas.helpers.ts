import { ElementRef } from '@angular/core';

export function loadImageToCanvas(imageData: ImageData, canvasElement: ElementRef) {
  var canvas: HTMLCanvasElement = canvasElement.nativeElement;
  const context = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  context.putImageData(imageData, 0, 0);
}
