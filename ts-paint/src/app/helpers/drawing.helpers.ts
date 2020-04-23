import { Point } from '../types/base/point';
import { Color } from '../types/base/color';
import { getPixelOffset } from './image.helpers';

export function drawLine(start: Point, end: Point, color: Color, image: ImageData) {
  const [x0, y0, x1, y1]: number[] = [start.w, start.h, end.w, end.h];
  bresenhamLinePlot([x0, y0, x1, y1], (x, y) => setPixel({ w: x, h: y }, color, image));
}

export function drawLines(points: Point[], color: Color, image: ImageData) {
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(points[i], points[i + 1], color, image);
  }
}

export function setPixel(point: Point, color: Color, image: ImageData) {
  const pixelOffset = getPixelOffset(point, image);
  if (pixelOffset !== undefined) {
    [image.data[pixelOffset], image.data[pixelOffset + 1], image.data[pixelOffset + 2], image.data[pixelOffset + 3]] = [color.r, color.g, color.b, 255];
  }
}

export function drawDashedFrame(image: ImageData) {
  const white: Color = { r: 255, g: 255, b: 255 };
  const blueish: Color = { r: 0, g: 120, b: 215 };
  let color: Color;

  for (var w = 0; w < image.width; w++) {
    if (Math.floor((w + 1) / 4) % 2 === 0) {
      color = white;
    } else {
      color = blueish;
    }
    setPixel({ w, h: 0 }, color, image);
    setPixel({ w, h: image.height - 1 }, color, image);
  }
  for (var h = 0; h < image.height; h++) {
    if (Math.floor((h + 1) / 4) % 2 === 0) {
      color = white;
    } else {
      color = blueish;
    }
    setPixel({ w: 0, h }, color, image);
    setPixel({ w: image.width - 1, h }, color, image);
  }
}

function bresenhamLinePlot([x0, y0, x1, y1]: number[], plot: (x, y) => void) {
  if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) {
    horizontalBresenhamLinePlot([x0, y0, x1, y1], (x, y) => plot(x, y));
  } else {
    // If the line is more vertical than horizontal, we need to swap the coordinates for Bresenham's algorithm
    horizontalBresenhamLinePlot([y0, x0, y1, x1], (x, y) => plot(y, x));
  }
}

function horizontalBresenhamLinePlot([x0, y0, x1, y1]: number[], plot: (x, y) => void) {
  const deltax: number = x1 - x0;
  const deltay: number = y1 - y0;
  const deltaerr: number = Math.abs(deltay / deltax);
  let error: number = 0.0;
  let y: number = y0;
  for (var x = x0; x1 > x0 ? x <= x1 : x >= x1; x1 > x0 ? x++ : x--) {
    plot(x, y);
    error = error + deltaerr;
    if (error >= 0.5) {
      y = y + Math.sign(deltay) * 1;
      error = error - 1.0;
    }
  }
}