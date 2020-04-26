import { DrawingToolAction } from './drawing-tool-action';
import { drawLine, getPixel, setPixelInOriginalImage } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { Color } from 'src/app/types/base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../../base/rectangle-area';
import { min, max, isEmpty } from 'src/app/helpers/typescript.helpers';
import { PointSet } from 'src/app/utils/point-set';
import { isPointInRectangle } from 'src/app/helpers/image.helpers';

export class ColorFillerAction extends DrawingToolAction {
  private _sameColorPixels: Point[] = [];

  constructor(public points: Point[], public swapColors: boolean, public renderIn: 'image' | 'preview' | 'nowhere') {
    super(points, swapColors, renderIn);
    this._needsPreviewPixels = true;
  }

  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    if (isEmpty(this._sameColorPixels)) {
      this._sameColorPixels = this.getSameColorPixels(this.points[0], state.image);
    }
    const minW: number = min(this._sameColorPixels.map(w => w.w));
    const maxW: number = max(this._sameColorPixels.map(w => w.w));
    const minH: number = min(this._sameColorPixels.map(w => w.h));
    const maxH: number = max(this._sameColorPixels.map(w => w.h));

    return { start: { w: minW, h: minH }, end: { w: maxW, h: maxH } };
  }

  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    if (isEmpty(this._sameColorPixels)) {
      this._sameColorPixels = this.getSameColorPixels(this.points[0], image);
    }
    this._sameColorPixels.forEach(pixel => {
      setPixelInOriginalImage(pixel, color1, image);
    });
  }

  private getSameColorPixels(point: Point, imageData: ImageData): Point[] {
    const sameColorPixels: Point[] = [];
    const color: Color = getPixel(point, imageData);

    const finishedPixels: PointSet = new PointSet(imageData.width);
    const pendingPixels: PointSet = new PointSet(imageData.width);

    pendingPixels.add(point);

    while (pendingPixels.size > 0) {
      pendingPixels.forEach(pixel => {
        const w: number = pixel.w;
        const h: number = pixel.h;

        this.addPointIfSameColor(imageData, color, { w: w - 1, h: h }, pendingPixels, finishedPixels);
        this.addPointIfSameColor(imageData, color, { w: w + 1, h: h }, pendingPixels, finishedPixels);
        this.addPointIfSameColor(imageData, color, { w: w, h: h - 1 }, pendingPixels, finishedPixels);
        this.addPointIfSameColor(imageData, color, { w: w, h: h + 1 }, pendingPixels, finishedPixels);
        pendingPixels.delete(pixel);
        finishedPixels.add(pixel);
      });
    }

    finishedPixels.forEach(pixel => {
      sameColorPixels.push(pixel);
    });

    return sameColorPixels;
  }

  private addPointIfSameColor(image: ImageData, color: Color, point: Point, pendingPixels: PointSet, finishedPixels: PointSet) {
    if (!isPointInRectangle(point, { start: { w: 0, h: 0 }, end: { w: image.width - 1, h: image.height - 1 } }) || pendingPixels.has(point) || finishedPixels.has(point)) {
      return;
    }
    const colorOfPixel: Color = getPixel(point, image);
    if (colorOfPixel.r === color.r && colorOfPixel.g === color.g && colorOfPixel.b === color.b) {
      pendingPixels.add(point);
    }
  }
}