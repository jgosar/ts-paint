import { ActionExecutor } from './action-executor';
import { TsPaintAction } from './ts-paint-action';
import { DrawingToolAction } from './drawing-tool-action';
import { RectangleArea } from '../base/rectangle-area';
import { Color } from '../base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../drawing-tools/drawing-tool-type';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';
import { drawLines, drawLine } from 'src/app/helpers/drawing.helpers';
import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';
import { Point } from '../base/point';

export abstract class DrawingToolActionExecutor<T extends DrawingToolAction> extends ActionExecutor<T>{
  protected abstract draw(points: Point[], color1: Color, color2: Color, image: ImageData);

  protected getAffectedArea(action: T): RectangleArea {
    const minW: number = Math.min(...action.points.map(x => x.w));
    const maxW: number = Math.max(...action.points.map(x => x.w));
    const minH: number = Math.min(...action.points.map(x => x.h));
    const maxH: number = Math.max(...action.points.map(x => x.h));

    return { start: { w: minW, h: minH }, end: { w: maxW, h: maxH } };
  }

  protected cropAction(action: T, offsetW: number, offsetH: number): T {
    return {
      ...action,
      points: action.points.map(point => { return { w: point.w - offsetW, h: point.h - offsetH }; })
    };
  }

  protected executeInternal(action: T, image: ImageData): ImageData {
    const state: TsPaintStoreState = this.getState();
    const color1: Color = action.swapColors ? state.secondaryColor : state.primaryColor;
    const color2: Color = action.swapColors ? state.primaryColor : state.secondaryColor;

    this.draw(action.points, color1, color2, image);

    return image;
  }
}