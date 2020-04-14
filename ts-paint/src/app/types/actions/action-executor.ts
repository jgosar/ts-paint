import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { cloneImage } from 'src/app/helpers/image.helpers';
import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';
import { Path } from 'Object/Path';

export abstract class ActionExecutor<T extends TsPaintAction>{
  constructor(protected getState: () => TsPaintStoreState) {

  }

  private _patches: TsPaintStatePatch<any>[];

  protected abstract executeInternal(action: T, image: ImageData);

  protected getAffectedArea(action: T): RectangleArea {
    return undefined;
  }

  protected cropAction(action: T, offsetW: number, offsetH: number): T {
    return action;
  }

  protected addPatch<P1 extends keyof Path<TsPaintStoreState, []>>(
    value: Path<TsPaintStoreState, [P1]>,
    property: P1
  ) {
    this._patches.push({ value, property });
  }

  public execute(action: T): TsPaintStatePatch<any>[] {
    this._patches = [];
    const state: TsPaintStoreState = this.getState();

    const affectedArea: RectangleArea = this.getAffectedArea(action);
    let image: ImageData;
    if (action.renderIn === 'preview') {
      image = new ImageData(this.getAreaWidth(affectedArea), this.getAreaHeight(affectedArea));
      action = this.cropAction(action, affectedArea.start.w, affectedArea.start.h);

      this.addPatch(affectedArea.start.w, 'previewOffsetW');
      this.addPatch(affectedArea.start.h, 'previewOffsetH');
    } else if (action.renderIn === 'image') {
      image = cloneImage(state.image);
    }

    this.executeInternal(action, image);

    if (action.renderIn === 'preview') {
      this.addPatch(image, 'previewImage');
    } else if (action.renderIn === 'image') {
      this.addPatch(image, 'image');
      this.addPatch(new ImageData(1, 1), 'previewImage');
    }

    return this._patches;
  }

  private getAreaWidth(area: RectangleArea) {
    return 1 + Math.abs(area.end.w - area.start.w);
  }

  private getAreaHeight(area: RectangleArea) {
    return 1 + Math.abs(area.end.h - area.start.h);
  }
}