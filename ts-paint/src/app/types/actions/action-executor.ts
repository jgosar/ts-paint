import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { cloneImage } from 'src/app/helpers/image.helpers';
import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';

export abstract class ActionExecutor<T extends TsPaintAction>{
  constructor(protected getState: () => TsPaintStoreState) {

  }

  protected abstract executeInternal(action: T, image: ImageData): TsPaintStatePatch<any>[];

  protected getAffectedArea(action: T): RectangleArea {
    return undefined;
  }

  protected cropAction(action: T, offsetW: number, offsetH: number): T {
    return action;
  }

  public execute(action: T): TsPaintStatePatch<any>[] {
    const patches: TsPaintStatePatch<any>[] = [];
    const state: TsPaintStoreState = this.getState();

    const affectedArea: RectangleArea = this.getAffectedArea(action);
    let image: ImageData;
    if (action.renderIn === 'preview') {
      image = new ImageData(this.getAreaWidth(affectedArea), this.getAreaHeight(affectedArea));
      action = this.cropAction(action, affectedArea.start.w, affectedArea.start.h);

      patches.push({ value: affectedArea.start.w, property: 'previewOffsetW' });
      patches.push({ value: affectedArea.start.h, property: 'previewOffsetH' });
    } else if (action.renderIn === 'image') {
      image = cloneImage(state.image);
    }

    patches.push(...this.executeInternal(action, image));

    if (action.renderIn === 'preview') {
      patches.push({ value: image, property: 'previewImage' });
    } else if (action.renderIn === 'image') {
      patches.push({ value: image, property: 'image' });
      patches.push({ value: new ImageData(1, 1), property: 'previewImage' });
    }

    return patches;
  }

  private getAreaWidth(area: RectangleArea) {
    return 1 + Math.abs(area.end.w - area.start.w);
  }

  private getAreaHeight(area: RectangleArea) {
    return 1 + Math.abs(area.end.h - area.start.h);
  }
}