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

  /**
   * Nearest-neighbour resampling in plain loops. Each target pixel copies the source pixel at its floored position,
   * which is what Paint's StretchBlt does. A canvas drawImage is not used on purpose: at 50% its sample points fall
   * exactly on source pixel boundaries and the GPU rasterizer rounds them to either side inconsistently, which turns
   * a 1px checkerboard into stripes.
   */
  private stretchImage(image: ImageData): ImageData {
    const width: number = Math.max(1, Math.floor((image.width * (this._params.horizontal || 100)) / 100));
    const height: number = Math.max(1, Math.floor((image.height * (this._params.vertical || 100)) / 100));
    const stretched: ImageData = new ImageData(width, height);
    const source: Uint32Array = new Uint32Array(image.data.buffer, image.data.byteOffset, image.data.length / 4);
    const target: Uint32Array = new Uint32Array(stretched.data.buffer);
    const sourceColumns: Int32Array = new Int32Array(width);
    for (let x: number = 0; x < width; x++) {
      sourceColumns[x] = Math.floor((x * image.width) / width);
    }

    let previousSourceRow: number = -1;
    for (let y: number = 0; y < height; y++) {
      const sourceRow: number = Math.floor((y * image.height) / height);
      const targetRow: number = y * width;
      if (sourceRow === previousSourceRow) {
        target.copyWithin(targetRow, targetRow - width, targetRow);
      } else {
        const sourceOffset: number = sourceRow * image.width;
        for (let x: number = 0; x < width; x++) {
          target[targetRow + x] = source[sourceOffset + sourceColumns[x]];
        }
      }
      previousSourceRow = sourceRow;
    }

    return stretched;
  }
}
