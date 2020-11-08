import { Point } from '../types/base/point';
import { Color } from '../types/base/color';
import { fillAreaInOriginalImage, getPixelOffset } from './image.helpers';
import { RectangleArea } from '../types/base/rectangle-area';
import { isDefined } from '@angular/compiler/src/util';
import { COLOR_WHITE } from '../services/ts-paint/ts-paint.config';

export function drawLine(start: Point, end: Point, color: Color, image: ImageData) {
  const [x0, y0, x1, y1]: number[] = [start.w, start.h, end.w, end.h];
  bresenhamLinePlot([x0, y0, x1, y1], (x, y) => setPixelInOriginalImage({ w: x, h: y }, color, image));
}

export function drawRectangle(
  { start: corner1, end: corner3 }: RectangleArea,
  color: Color,
  image: ImageData,
  drawLineFunction?: (start: Point, end: Point, color: Color, image: ImageData) => void
) {
  const corner2: Point = { w: corner1.w, h: corner3.h };
  const corner4: Point = { w: corner3.w, h: corner1.h };

  if (!isDefined(drawLineFunction)) {
    drawLineFunction = drawLine;
  }

  drawLineFunction(corner1, corner2, color, image);
  drawLineFunction(corner2, corner3, color, image);
  drawLineFunction(corner3, corner4, color, image);
  drawLineFunction(corner4, corner1, color, image);
}

export function fillRectangle(
  area: RectangleArea,
  color: Color,
  image: ImageData
) {
  fillAreaInOriginalImage(image, color, area);
}

export function drawEllipse(start: Point, end: Point, color: Color, image: ImageData) {
  const [x0, y0, x1, y1]: number[] = [start.w, start.h, end.w, end.h];
  ellipsePlot([x0, y0, x1, y1], (x, y) => setPixelInOriginalImage({ w: x, h: y }, color, image));
}

export function drawLines(points: Point[], color: Color, image: ImageData) {
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(points[i], points[i + 1], color, image);
  }
}

export function setPixelInOriginalImage(point: Point, color: Color, image: ImageData) {
  const pixelOffset = getPixelOffset(point, image);
  if (pixelOffset !== undefined) {
    [image.data[pixelOffset], image.data[pixelOffset + 1], image.data[pixelOffset + 2], image.data[pixelOffset + 3]] = [
      color.r,
      color.g,
      color.b,
      255,
    ];
  }
}

export function getPixel(point: Point, image: ImageData): Color {
  let color: Color = { r: 0, g: 0, b: 0 };
  const pixelOffset = getPixelOffset(point, image);
  if (pixelOffset !== undefined) {
    color = { r: image.data[pixelOffset], g: image.data[pixelOffset + 1], b: image.data[pixelOffset + 2] };
  }

  return color;
}

export function invertColor(color: Color): Color {
  return { r: 255 - color.r, g: 255 - color.g, b: 255 - color.b, a: color.a };
}

export function drawDashedFrame(image: ImageData) {
  const blueish: Color = { r: 0, g: 120, b: 215 };
  let color: Color;

  for (let w = 0; w < image.width; w++) {
    if (Math.floor((w + 1) / 4) % 2 === 0) {
      color = COLOR_WHITE;
    } else {
      color = blueish;
    }
    setPixelInOriginalImage({ w, h: 0 }, color, image);
    setPixelInOriginalImage({ w, h: image.height - 1 }, color, image);
  }
  for (let h = 0; h < image.height; h++) {
    if (Math.floor((h + 1) / 4) % 2 === 0) {
      color = COLOR_WHITE;
    } else {
      color = blueish;
    }
    setPixelInOriginalImage({ w: 0, h }, color, image);
    setPixelInOriginalImage({ w: image.width - 1, h }, color, image);
  }
}

export function calculateShapeDimensions(start: Point, end: Point): Point {
  let width: number = end.w - start.w;
  if (width >= 0) {
    width++;
  } else {
    width--;
  }
  let height: number = end.h - start.h;
  if (height >= 0) {
    height++;
  } else {
    height--;
  }

  return { w: width, h: height };
}

export function getLinePoints(start: Point, end: Point): Point[] {
  const points: Point[] = [];
  const [x0, y0, x1, y1]: number[] = [start.w, start.h, end.w, end.h];

  bresenhamLinePlot([x0, y0, x1, y1], (x, y) => points.push({ w: x, h: y }));

  return points;
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
  for (let x = x0; x1 > x0 ? x <= x1 : x >= x1; x1 > x0 ? x++ : x--) {
    plot(x, y);
    error = error + deltaerr;
    if (error >= 0.5) {
      y = y + Math.sign(deltay) * 1;
      error = error - 1.0;
    }
  }
}

function ellipsePlot([x0, y0, x1, y1]: number[], plot: (x, y) => void) {
  // As seen on: https://www.geeksforgeeks.org/midpoint-ellipse-drawing-algorithm/
  const rx: number = Math.abs(x0 - x1) / 2;
  const ry: number = Math.abs(y0 - y1) / 2;
  const xc: number = (x0 + x1) / 2;
  const yc: number = (y0 + y1) / 2;
  let dx: number;
  let dy: number;
  let d1: number;
  let d2: number;
  let x: number;
  let y: number;
  x = rx - Math.floor(rx);
  y = ry;

  // Initial decision parameter of region 1
  d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
  dx = 2 * ry * ry * x;
  dy = 2 * rx * rx * y;

  // For region 1
  while (dx < dy) {
    // Plot points based on 4-way symmetry
    plot(x + xc, y + yc);
    plot(-x + xc, y + yc);
    plot(x + xc, -y + yc);
    plot(-x + xc, -y + yc);

    // Checking and updating value of
    // decision parameter based on algorithm
    if (d1 < 0) {
      x++;
      dx = dx + 2 * ry * ry;
      d1 = d1 + dx + ry * ry;
    } else {
      x++;
      y--;
      dx = dx + 2 * ry * ry;
      dy = dy - 2 * rx * rx;
      d1 = d1 + dx - dy + ry * ry;
    }
  }

  // Decision parameter of region 2
  d2 = ry * ry * ((x + 0.5) * (x + 0.5)) + rx * rx * ((y - 1) * (y - 1)) - rx * rx * ry * ry;

  // Plotting points of region 2
  while (y >= 0) {
    // Plot points based on 4-way symmetry
    plot(x + xc, y + yc);
    plot(-x + xc, y + yc);
    plot(x + xc, -y + yc);
    plot(-x + xc, -y + yc);

    // Checking and updating parameter
    // value based on algorithm
    if (d2 > 0) {
      y--;
      dy = dy - 2 * rx * rx;
      d2 = d2 + rx * rx - dy;
    } else {
      y--;
      x++;
      dx = dx + 2 * ry * ry;
      dy = dy - 2 * rx * rx;
      d2 = d2 + dx - dy + rx * rx;
    }
  }
}
