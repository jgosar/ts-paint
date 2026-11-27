import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { Point } from '../base/point';
import { pasteImagePart, getImagePart, makeColorTransparent } from '../../helpers/image.helpers';
import { Color } from '../base/color';
import { RectangleArea } from '../base/rectangle-area';
import { PasteImageAction } from './paste-image-action';
import { MoveSelectionAction } from './move-selection-action';

export class DeselectSelectionAction extends TsPaintAction {
  /**
   * @param transparentColor When set (Draw Opaque is off), the selection's pixels of this color are not pasted, so the
   * image shows through them. Undo chains use this action without it, to put back exactly the pixels they saved.
   */
  constructor(public transparentColor?: Color) {
    super('image');
  }

  public static getDeselectPatches(): Partial<TsPaintStoreState> {
    return {
      selectionImage: undefined,
      selectionOffset: { w: 0, h: 0 },
      moveSelectionTool: undefined,
    };
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (state.selectionImage !== undefined) {
      const selectionOffset: Point = state.selectionOffset;
      const image: ImageData = pasteImagePart(
        selectionOffset,
        makeColorTransparent(state.selectionImage, this.transparentColor),
        state.image
      );

      const patches: Partial<TsPaintStoreState> = DeselectSelectionAction.getDeselectPatches();

      return { image, patches };
    }

    return {};
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    const pasteArea: RectangleArea = {
      start: state.selectionOffset,
      end: {
        w: state.selectionOffset.w + state.selectionImage.width - 1,
        h: state.selectionOffset.h + state.selectionImage.height - 1,
      },
    };
    const oldImagePart: ImageData = getImagePart(pasteArea, state.image);
    return [
      new PasteImageAction(oldImagePart),
      new MoveSelectionAction(state.selectionOffset),
      new DeselectSelectionAction(),
      new PasteImageAction(state.selectionImage),
      new MoveSelectionAction(state.selectionOffset),
    ];
  }
}
