import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { cloneImage, getAreaWidth, getAreaHeight } from 'src/app/helpers/image.helpers';
import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';
import { Path } from 'Object/Path';

export abstract class ActionExecutor<T extends TsPaintAction>{
  constructor(protected getState: () => TsPaintStoreState) {

  }

  private _patches: TsPaintStatePatch<any>[];

  protected abstract executeInternal(action: T, image: ImageData): ImageData;

  protected getAffectedArea(action: T): RectangleArea {
    return { start: { w: 0, h: 0 }, end: { w: 0, h: 0 } };
  }

  protected cropAction(action: T, offsetW: number, offsetH: number): T {
    return action;
  }

  protected abstract getUndoActions(action: T): TsPaintAction[];

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
    action.undoActions = this.getUndoActions(action);
    let image: ImageData;
    if (action.renderIn === 'preview') {
      image = new ImageData(getAreaWidth(affectedArea), getAreaHeight(affectedArea));
      action = this.cropAction(action, affectedArea.start.w, affectedArea.start.h);

      this.addPatch(affectedArea.start.w, 'previewOffsetW');
      this.addPatch(affectedArea.start.h, 'previewOffsetH');
    } else if (action.renderIn === 'image') {
      image = cloneImage(state.image);
    }

    image = this.executeInternal(action, image);

    if (action.renderIn === 'preview') {
      this.addPatch(image, 'previewImage');;
    } else if (action.renderIn === 'image') {
      this.addPatch(image, 'image');
      this.addPatch(new ImageData(1, 1), 'previewImage');
    }

    if (action.renderIn === 'preview') {
      this.addPatch(action, 'previewAction');
    } else if (action.renderIn === 'image') {
      this.addPatch(undefined, 'previewAction');
      this.addPatch(state.actions.concat(action), 'actions');
    }

    return this._patches;
  }
}