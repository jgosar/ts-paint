import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { isDefined } from 'src/app/helpers/typescript.helpers';
import { loadImageToCanvas } from 'src/app/helpers/canvas.helpers';

export type RotateImageActionAngle = 90 | 180 | 270;

export class RotateImageAction extends TsPaintAction {
  constructor(private _angle: RotateImageActionAngle) {
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
    return [new RotateImageAction(<RotateImageActionAngle>(360 - this._angle))];
  }

  private rotateImage(image: ImageData): ImageData {
    const tmpCanvas: HTMLCanvasElement = document.createElement('canvas');
    loadImageToCanvas(image, tmpCanvas);

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
    context.drawImage(tmpCanvas, -image.width / 2, -image.height / 2);

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }
}
