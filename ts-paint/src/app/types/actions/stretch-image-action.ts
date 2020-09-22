import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { isDefined } from 'src/app/helpers/typescript.helpers';
import { StretchParams } from '../action-params/stretch-skew-params';
import { PasteImageAction } from './paste-image-action';
import { DeselectSelectionAction } from './deselect-selection-action';
import { CropAction } from './crop-action';
import { MoveSelectionAction } from './move-selection-action';

export class StretchImageAction extends TsPaintAction {
  constructor(private _params: StretchParams) {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (isDefined(state.selectionImage)) {
      const patches: Partial<TsPaintStoreState> = { selectionImage: this.stretchImage(state.selectionImage) };
      return { patches };
    } else {
      const image: ImageData = this.stretchImage(state.image);
      return { image };
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    if (isDefined(state.selectionImage)) {
      return [new PasteImageAction(state.selectionImage), new MoveSelectionAction(state.selectionOffset)];
    } else {
      return [new PasteImageAction(state.image), new CropAction(), new DeselectSelectionAction()];
    }
  }

  private stretchImage(image: ImageData): ImageData {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    const horizontalScale: number = (this._params.horizontal || 100) / 100;
    const verticalScale: number = (this._params.vertical || 100) / 100;

    canvas.width = image.width * Math.max(1, horizontalScale);
    canvas.height = image.height * Math.max(1, verticalScale);

    context.putImageData(image, 0, 0);
    context.imageSmoothingEnabled = false;

    context.scale(horizontalScale, verticalScale);
    context.drawImage(canvas, 0, 0);

    return context.getImageData(0, 0, image.width * horizontalScale, image.height * verticalScale);
  }
}
