import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { Point } from '../base/point';
import { getAreaWidth, getAreaHeight, cloneImage } from 'src/app/helpers/image.helpers';
import { PartialActionResult } from './partial-action-result';

export abstract class TsPaintAction {
  public undoActions: TsPaintAction[] = [];
  protected _previewOffset: Point = { h: 0, w: 0 };

  constructor(public renderIn: 'image' | 'preview' | 'nowhere') {
  }

  public getStatePatches(state: TsPaintStoreState): Partial<TsPaintStoreState> {
    let patches: Partial<TsPaintStoreState> = {};

    this.undoActions = this.getUndoActions(state);

    if (this.renderIn === 'preview') {
      this._previewOffset = this.getPreviewOffset();
    }

    let partialResult: PartialActionResult = this.addPatchesAndDraw(state);
    if (partialResult.patches !== undefined) {
      patches = {
        ...patches,
        ...partialResult.patches
      };
    }

    if (partialResult.image !== undefined) {
      if (this.renderIn === 'preview') {
        patches.previewImage = partialResult.image;
        patches.previewOffset = this._previewOffset;
      } else if (this.renderIn === 'image') {
        patches.image = partialResult.image;
        patches.previewImage = new ImageData(1, 1);
      }
    }

    if (this.renderIn === 'preview') {
      patches.previewAction = this;
    } else if (this.renderIn === 'image') {
      patches.previewAction = undefined;
      patches.actions = state.actions.concat(this);
    }

    return patches;
  }

  protected abstract addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult;
  protected abstract getUndoActions(state: TsPaintStoreState): TsPaintAction[];

  protected getAffectedArea(): RectangleArea {
    // Override this if necessary
    return { start: { w: 0, h: 0 }, end: { w: 0, h: 0 } };
  }

  protected getPreviewOffset(): Point {
    const affectedArea: RectangleArea = this.getAffectedArea();
    return affectedArea.start;
  }

  protected getWorkingImage(state: TsPaintStoreState): ImageData {
    let workingImage: ImageData;
    if (this.renderIn === 'preview') {
      const affectedArea: RectangleArea = this.getAffectedArea();
      this._previewOffset = affectedArea.start;
      workingImage = new ImageData(getAreaWidth(affectedArea), getAreaHeight(affectedArea));
    } else if (this.renderIn === 'image') {
      workingImage = cloneImage(state.image);
    }

    return workingImage;
  }
}