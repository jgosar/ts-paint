import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { isDefined } from 'src/app/helpers/typescript.helpers';

export class FlipImageAction extends TsPaintAction {
  constructor(private _direction: 'horizontal' | 'vertical') {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (isDefined(state.selectionImage)) {
      const patches: Partial<TsPaintStoreState> = { selectionImage: this.flipImage(state.selectionImage) };
      return { patches };
    } else {
      const image: ImageData = this.flipImage(state.image);
      return { image };
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new FlipImageAction(this._direction)];
  }

  private flipImage(image: ImageData): ImageData {
    var canvas: HTMLCanvasElement = document.createElement('canvas');
    var context: CanvasRenderingContext2D = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;

    context.putImageData(image, 0, 0);
    if (this._direction === 'horizontal') {
      context.scale(-1, 1);
      context.drawImage(canvas, -image.width, 0);
    } else {
      context.scale(1, -1);
      context.drawImage(canvas, 0, -image.height);
    }

    return context.getImageData(0, 0, image.width, image.height);
  }
}
