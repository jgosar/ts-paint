import { DrawingToolAction } from './drawing-tool-action';
import { drawLines, getLinePoints, setPixel, invertColor, getPixel } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { Color } from 'src/app/types/base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../../base/rectangle-area';
import { getImagePart, fillAreaInOriginalImage } from 'src/app/helpers/image.helpers';

export class DrawRectangleSelectAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    if (this.renderIn === 'preview') {
      const corners: Point[] = [
        points[0],
        { w: points[1].w, h: points[0].h },
        points[1],
        { w: points[0].w, h: points[1].h },
      ];
      this.paintDashInvertedLine(corners[0], corners[1], state, image);
      this.paintDashInvertedLine(corners[0], corners[3], state, image);
      this.paintDashInvertedLine(corners[1], corners[2], state, image);
      this.paintDashInvertedLine(corners[3], corners[2], state, image);
    } else if (this.renderIn === 'image') {
      const area: RectangleArea = { start: points[0], end: points[1] };
      fillAreaInOriginalImage(image, state.secondaryColor, area);
    }
  }

  protected addPatches(state: TsPaintStoreState): Partial<TsPaintStoreState> {
    const patches: Partial<TsPaintStoreState> = {};

    if (this.renderIn === 'image') {
      const area: RectangleArea = { start: this.points[0], end: this.points[1] };
      patches.selectionImage = getImagePart(area, state.image);
      patches.selectionOffset = { w: Math.min(area.start.w, area.end.w), h: Math.min(area.start.h, area.end.h) };
    }

    return patches;
  }

  private paintDashInvertedLine(start: Point, end: Point, state: TsPaintStoreState, image: ImageData) {
    const imageToInvert: ImageData = getImagePart(this.getAffectedArea(state), state.image);
    const dashLength: number = Math.ceil(4 / state.zoom)
    const pointsToPaint: Point[] = getLinePoints(start, end);
    pointsToPaint.forEach((point, index) => {
      if (Math.floor(index / dashLength) % 2 === 0) {
        setPixel(point, invertColor(getPixel(point, imageToInvert)), image);
      }
    });
  }
}