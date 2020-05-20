import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { isDefined } from 'src/app/helpers/typescript.helpers';

export class InvertColorsAction extends TsPaintAction {
  constructor() {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (isDefined(state.selectionImage)) {
      const patches: Partial<TsPaintStoreState> = { selectionImage: this.invertColors(state.selectionImage) };
      return { patches };
    } else {
      const image: ImageData = this.invertColors(state.image);
      return { image };
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new InvertColorsAction()
    ];
  }

  private invertColors(image: ImageData): ImageData {
    const invertedImage: ImageData = new ImageData(image.width, image.height);
    for (let i = 0; i < image.data.length; i++) {
      if (i % 4 === 3) {
        invertedImage.data[i] = image.data[i]; // subpixel A
      } else {
        invertedImage.data[i] = 255 - image.data[i]; // subpixels R, G, B
      }
    }

    return invertedImage;
  }
}
