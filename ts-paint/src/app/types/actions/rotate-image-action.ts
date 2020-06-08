import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { isDefined } from 'src/app/helpers/typescript.helpers';

export class RotateImageAction extends TsPaintAction {
  constructor(private _angle: number) {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (isDefined(state.selectionImage)) {
      const patches: Partial<TsPaintStoreState> = { selectionImage: this.rotateImage(state.selectionImage) };
      return { patches };
    } else {
      const image: ImageData = this.rotateImage(state.image);
      return { image };
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new RotateImageAction(-this._angle)];
  }

  private rotateImage(image: ImageData): ImageData {
    var canvas: HTMLCanvasElement = document.createElement('canvas');
    var context: CanvasRenderingContext2D = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    context.putImageData(image, 0, 0);
    // TODO
    /*if (this._direction === 'horizontal') {
      context.scale(-1, 1);
      context.drawImage(canvas, -image.width, 0);
    } else {
      context.scale(1, -1);
      context.drawImage(canvas, 0, -image.height);
    }*/

    return context.getImageData(0, 0, image.width, image.height);
  }
}
