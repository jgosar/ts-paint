import { Point } from '../../base/point';
import { TsPaintAction } from '../ts-paint-action';
import { Color } from '../../base/color';
import { RectangleArea } from '../../base/rectangle-area';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { getImagePart } from '../../../helpers/image.helpers';
import { PartialActionResult } from '../partial-action-result';
import { PasteImageAction } from '../paste-image-action';
import { MoveSelectionAction } from '../move-selection-action';
import { DeselectSelectionAction } from '../deselect-selection-action';

export abstract class DrawingToolAction extends TsPaintAction {
  constructor(public points: Point[], public swapColors: boolean, public renderIn: 'image' | 'preview' | 'nowhere') {
    super(renderIn);
    this._deselectsSelection = true;
  }

  protected abstract draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState);

  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    const minW: number = Math.min(...this.points.map(x => x.w));
    const maxW: number = Math.max(...this.points.map(x => x.w));
    const minH: number = Math.min(...this.points.map(x => x.h));
    const maxH: number = Math.max(...this.points.map(x => x.h));

    return { start: { w: minW, h: minH }, end: { w: maxW, h: maxH } };
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const color1: Color = this.swapColors ? state.secondaryColor : state.primaryColor;
    const color2: Color = this.swapColors ? state.primaryColor : state.secondaryColor;

    const patches: Partial<TsPaintStoreState> = this.addPatches(state);
    const image: ImageData = this.getWorkingImage(state);
    this.draw(this.getOffsetPoints(), color1, color2, image, state);

    return { patches, image };
  }

  private getOffsetPoints(): Point[] {
    return this.points.map(point => ({ w: point.w - this._previewOffset.w, h: point.h - this._previewOffset.h }));
  }

  protected addPatches(state: TsPaintStoreState): Partial<TsPaintStoreState> {
    // Override this if necessary
    return {};
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    const affectedArea: RectangleArea = this.getAffectedArea(state);
    const undoImage: ImageData = getImagePart(affectedArea, state.image);

    return [
      new PasteImageAction(undoImage),
      new MoveSelectionAction({ w: affectedArea.start.w, h: affectedArea.start.h }),
      new DeselectSelectionAction()
    ];
  }
}
