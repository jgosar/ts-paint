import { DrawingToolAction } from './drawing-tool-action';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { TsPaintAction } from '../ts-paint-action';

export class MagnifierAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
  }

  protected addPatches(state: TsPaintStoreState): Partial<TsPaintStoreState> {
    const zoomMultiplier = this.swapColors ? 0.5 : 2; // right/left mouse button

    return { zoom: state.zoom * zoomMultiplier };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new MagnifierAction(this.points, !this.swapColors, this.renderIn)];
  }
}
