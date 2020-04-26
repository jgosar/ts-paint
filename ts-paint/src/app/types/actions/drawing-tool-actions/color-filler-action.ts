import { DrawingToolAction } from './drawing-tool-action';
import { getPixel, setPixelInOriginalImage } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { Color } from 'src/app/types/base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../../base/rectangle-area';
import { min, max, isEmpty } from 'src/app/helpers/typescript.helpers';
import { isPointInRectangle } from 'src/app/helpers/image.helpers';

export class ColorFillerAction extends DrawingToolAction {
  private _sameColorPixels: Point[] = [];

  constructor(public points: Point[], public swapColors: boolean, public renderIn: 'image' | 'preview' | 'nowhere') {
    super(points, swapColors, renderIn);
    this._needsPreviewPixels = true;
  }

  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    const newColor: Color = this.swapColors ? state.secondaryColor : state.primaryColor;
    if (isEmpty(this._sameColorPixels)) {
      this._sameColorPixels = this.getSameColorPixels(this.points[0], newColor, state.image);
    }
    const minW: number = min(this._sameColorPixels.map(w => w.w));
    const maxW: number = max(this._sameColorPixels.map(w => w.w));
    const minH: number = min(this._sameColorPixels.map(w => w.h));
    const maxH: number = max(this._sameColorPixels.map(w => w.h));

    return { start: { w: minW, h: minH }, end: { w: maxW, h: maxH } };
  }

  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    if (isEmpty(this._sameColorPixels)) {
      this._sameColorPixels = this.getSameColorPixels(this.points[0], color1, image);
    }
    this._sameColorPixels.forEach(pixel => {
      setPixelInOriginalImage(pixel, color1, image);
    });
  }

  private getSameColorPixels(point: Point, newColor: Color, imageData: ImageData): Point[] {
    const sameColorPixels: Point[] = [];
    const color: Color = getPixel(point, imageData);
    if (this.isSameColor(newColor, color)) {
      return sameColorPixels;
    }

    const pixelQueue: Point[] = [];
    const visitedPixels: boolean[][] = [];
    for (var w = 0; w < imageData.width; w++) {
      visitedPixels[w] = [];
    }

    pixelQueue.push(point);

    while (!isEmpty(pixelQueue)) {
      const pixel = pixelQueue.shift();

      const w: number = pixel.w;
      const h: number = pixel.h;
      visitedPixels[w][h] = true;

      this.addPointIfSameColor(imageData, color, { w: w - 1, h: h }, pixelQueue, visitedPixels);
      this.addPointIfSameColor(imageData, color, { w: w + 1, h: h }, pixelQueue, visitedPixels);
      this.addPointIfSameColor(imageData, color, { w: w, h: h - 1 }, pixelQueue, visitedPixels);
      this.addPointIfSameColor(imageData, color, { w: w, h: h + 1 }, pixelQueue, visitedPixels);

      sameColorPixels.push(pixel);
    }

    return sameColorPixels;
  }

  private addPointIfSameColor(image: ImageData, color: Color, point: Point, pixelQueue: Point[], visitedPixels: boolean[][]) {
    if (!isPointInRectangle(point, { start: { w: 0, h: 0 }, end: { w: image.width - 1, h: image.height - 1 } }) || visitedPixels[point.w][point.h] !== undefined) {
      return;
    }
    const colorOfPixel: Color = getPixel(point, image);
    if (this.isSameColor(colorOfPixel, color)) {
      visitedPixels[point.w][point.h] = false;
      pixelQueue.push(point);
    }
  }

  private isSameColor(color1: Color, color2: Color): boolean {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  }
}