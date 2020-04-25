import { DrawingToolAction } from './drawing-tool-action';
import { drawLine, getPixel, setPixelInOriginalImage } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { Color } from 'src/app/types/base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../../base/rectangle-area';
import { min, max } from 'src/app/helpers/typescript.helpers';

export class ColorFillerAction extends DrawingToolAction {
  constructor(public points: Point[], public swapColors: boolean, public renderIn: 'image' | 'preview' | 'nowhere') {
    super(points, swapColors, renderIn);
    this._needsPreviewPixels = true;
  }

  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    const sameColorPixels: Point[] = this.getSameColorPixels(this.points[0], state.image);
    const minW: number = min(sameColorPixels.map(w => w.w));
    const maxW: number = max(sameColorPixels.map(w => w.w));
    const minH: number = min(sameColorPixels.map(w => w.h));
    const maxH: number = max(sameColorPixels.map(w => w.h));

    return { start: { w: minW, h: minH }, end: { w: maxW, h: maxH } };
  }

  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    const sameColorPixels: Point[] = this.getSameColorPixels(this.points[0], image);
    sameColorPixels.forEach(pixel => {
      setPixelInOriginalImage(pixel, color1, image);
    });
  }

  private getSameColorPixels(point: Point, imageData: ImageData): Point[] {
    const sameColorPixels: Point[] = [];
    const color: Color = getPixel(point, imageData);

    const finishedPixels: Set<string> = new Set<string>();
    const pendingPixels: Set<string> = new Set<string>();

    pendingPixels.add(point.w + '_' + point.h);

    while (pendingPixels.size > 0) {
      pendingPixels.forEach(coords => {
        const w: number = parseInt(coords.split('_')[0]);
        const h: number = parseInt(coords.split('_')[1]);

        this.addPointIfSameColor(imageData, color, w - 1, h, pendingPixels, finishedPixels);
        this.addPointIfSameColor(imageData, color, w + 1, h, pendingPixels, finishedPixels);
        this.addPointIfSameColor(imageData, color, w, h - 1, pendingPixels, finishedPixels);
        this.addPointIfSameColor(imageData, color, w, h + 1, pendingPixels, finishedPixels);
        pendingPixels.delete(coords);
        finishedPixels.add(coords);
      });
    }

    finishedPixels.forEach(coords => {
      const w: number = parseInt(coords.split('_')[0]);
      const h: number = parseInt(coords.split('_')[1]);

      sameColorPixels.push({ w, h });
    });

    return sameColorPixels;
  }

  private addPointIfSameColor(imageData: ImageData, color: Color, w: number, h: number, pendingPixels: Set<string>, finishedPixels: Set<string>) {
    if (w < 0 || h < 0 || w > imageData.width || h > imageData.height || pendingPixels.has(w + '_' + h) || finishedPixels.has(w + '_' + h)) {
      return;
    }
    const colorOfPixel: Color = getPixel({ w, h }, imageData);
    if (colorOfPixel.r === color.r && colorOfPixel.g === color.g && colorOfPixel.b === color.b) {
      pendingPixels.add(w + '_' + h);
    }
  }
}