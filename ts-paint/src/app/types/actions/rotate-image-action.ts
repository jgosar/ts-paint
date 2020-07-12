import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { isDefined } from 'src/app/helpers/typescript.helpers';

export class RotateImageAction extends TsPaintAction {
  constructor(private _angle: 90 | 180 | 270) {
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
    return [new RotateImageAction(<90 | 180 | 270>(360 - this._angle))];
  }

  private rotateImage(image: ImageData): ImageData {
    const canvas0: HTMLCanvasElement = document.createElement('canvas');
    const context0: CanvasRenderingContext2D = canvas0.getContext('2d');
    canvas0.width = image.width;
    canvas0.height = image.height;
    context0.putImageData(image, 0, 0);

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    if (this._angle === 180) {
      canvas.width = image.width;
      canvas.height = image.height;
    } else {
      canvas.width = image.height;
      canvas.height = image.width;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    if (this._angle === 180) {
      context.translate(image.width / 2, image.height / 2);
    } else {
      context.translate(image.height / 2, image.width / 2);
    }
    context.rotate((this._angle * Math.PI) / 180);
    context.drawImage(canvas0, -image.width / 2, -image.height / 2);

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }
}
