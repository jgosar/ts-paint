export function loadImageToCanvas(imageData: ImageData, canvas: HTMLCanvasElement) {
  const context: CanvasRenderingContext2D = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  context.putImageData(imageData, 0, 0);
}
