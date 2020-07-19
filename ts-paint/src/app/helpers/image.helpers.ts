import { Color } from '../types/base/color';
import { Point } from '../types/base/point';
import { RectangleArea } from '../types/base/rectangle-area';
import { loadImageToCanvas } from './canvas.helpers';
import { COLOR_WHITE } from '../services/ts-paint/ts-paint.config';

export function createImage(width: number, height: number, color: Color = COLOR_WHITE): ImageData {
  const image: ImageData = new ImageData(width, height);
  return fillImage(image, color);
}

export function cloneImage(original: ImageData): ImageData {
  const clone: ImageData = new ImageData(original.width, original.height);

  clone.data.set(original.data);

  return clone;
}

export function fillImage(image: ImageData, color: Color): ImageData {
  return fillArea(image, color, { start: { w: 0, h: 0 }, end: { w: image.width - 1, h: image.height - 1 } });
}

export function fillAreaInOriginalImage(image: ImageData, color: Color, area: RectangleArea) {
  for (let i = 0; i < image.data.length; i += 4) {
    if (isSubpixelInRectangle(i, area, image)) {
      [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]] = [
        color.r,
        color.g,
        color.b,
        color.a ?? 255,
      ];
    }
  }
}

export function fillArea(image: ImageData, color: Color, area: RectangleArea): ImageData {
  const newImage: ImageData = new ImageData(image.width, image.height);
  const newImageData: Uint8ClampedArray = newImage.data;

  for (let i = 0; i < newImageData.length; i += 4) {
    if (isSubpixelInRectangle(i, area, image)) {
      [newImageData[i], newImageData[i + 1], newImageData[i + 2], newImageData[i + 3]] = [
        color.r,
        color.g,
        color.b,
        color.a ?? 255,
      ];
    } else {
      [newImageData[i], newImageData[i + 1], newImageData[i + 2], newImageData[i + 3]] = [
        image.data[i],
        image.data[i + 1],
        image.data[i + 2],
        color.a ?? 255,
      ];
    }
  }

  return newImage;
}

export function isSubpixelInRectangle(subpixelOffset: number, rectangle: RectangleArea, image: ImageData): boolean {
  const location: Point = calculateLocation(subpixelOffset, image);

  return isPointInRectangle(location, rectangle);
}

export function isPointInRectangle(point: Point, rectangle: RectangleArea): boolean {
  return (
    point.w >= Math.min(rectangle.start.w, rectangle.end.w) &&
    point.w <= Math.max(rectangle.start.w, rectangle.end.w) &&
    point.h >= Math.min(rectangle.start.h, rectangle.end.h) &&
    point.h <= Math.max(rectangle.start.h, rectangle.end.h)
  );
}

export function calculateLocation(subpixelOffset: number, image: ImageData): Point {
  const pixelIndex: number = Math.floor(subpixelOffset / 4);
  const h: number = Math.floor(pixelIndex / image.width);
  const w: number = pixelIndex - image.width * h;

  return { w, h };
}

export function getPixelOffset(point: Point, image: ImageData): number | undefined {
  if (isPointInRectangle(point, { start: { w: 0, h: 0 }, end: { w: image.width - 1, h: image.height - 1 } })) {
    return 4 * (point.w + image.width * point.h);
  }
}

export function getImagePart(area: RectangleArea, image: ImageData): ImageData {
  const areaInImage: RectangleArea = getAreaInImage(area, image);
  const imagePart: ImageData = new ImageData(getAreaWidth(areaInImage), getAreaHeight(areaInImage));

  const subpixelsPerRow: number = 4 * imagePart.width;

  const hMin: number = areaInImage.start.h;
  const wMin: number = areaInImage.start.w;

  let imagePixelOffset: number;
  let partPixelOffset: number = 0;

  for (let h = 0; h < imagePart.height; h++) {
    imagePixelOffset = getPixelOffset({ w: wMin, h: hMin + h }, image);
    for (let spw = 0; spw < subpixelsPerRow; spw++) {
      imagePart.data[partPixelOffset] = image.data[imagePixelOffset + spw];
      partPixelOffset++;
    }
  }

  return imagePart;
}

export function getAreaInImage(area: RectangleArea, image: ImageData): RectangleArea {
  const startW: number = Math.max(0, Math.min(area.start.w, area.end.w));
  const startH: number = Math.max(0, Math.min(area.start.h, area.end.h));
  const endW: number = Math.min(image.width - 1, Math.max(area.start.w, area.end.w));
  const endH: number = Math.min(image.height - 1, Math.max(area.start.h, area.end.h));

  return { start: { w: startW, h: startH }, end: { w: endW, h: endH } };
}

export function getAreaWidth(area: RectangleArea): number {
  return 1 + Math.abs(area.end.w - area.start.w);
}

export function getAreaHeight(area: RectangleArea): number {
  return 1 + Math.abs(area.end.h - area.start.h);
}

export function pasteImagePart(location: Point, imagePart: ImageData, image: ImageData): ImageData {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const context: CanvasRenderingContext2D = canvas.getContext('2d');
  loadImageToCanvas(image, canvas);
  context.putImageData(imagePart, location.w, location.h);
  const result: ImageData = context.getImageData(0, 0, image.width, image.height);

  return result;
}

export function copyImagePart(imagePart: ImageData) {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  loadImageToCanvas(imagePart, canvas);
  canvas.toBlob((blob) => {
    try {
      // @ts-ignore
      const item = new ClipboardItem({ 'image/png': blob });
      // @ts-ignore
      navigator.clipboard.write([item]);
    } catch (e) {
      alert('Sorry, your browser does not support copying images to clipboard (Try Chrome ;))');
    }
  });
}

export function resizeImage(image: ImageData, newWidth: number, newHeight: number, backgroundColor: Color): ImageData {
  let resized: ImageData = new ImageData(newWidth, newHeight);
  resized = fillImage(resized, backgroundColor);
  resized = pasteImagePart({ w: 0, h: 0 }, image, resized);

  return resized;
}

export function constrainPointToImage(image: ImageData, point: Point): Point {
  const w: number = Math.min(Math.max(0, point.w), (image?.width ?? 1) - 1);
  const h: number = Math.min(Math.max(0, point.h), (image?.height ?? 1) - 1);
  return { w, h };
}
