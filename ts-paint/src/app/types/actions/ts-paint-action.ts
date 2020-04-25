import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { Point } from '../base/point';
import { getAreaWidth, getAreaHeight, cloneImage, getImagePart } from 'src/app/helpers/image.helpers';
import { PartialActionResult } from './partial-action-result';
import { lastElement, isEmpty } from 'src/app/helpers/typescript.helpers';

export abstract class TsPaintAction {
  public undoActions: TsPaintAction[] = [];
  protected _previewOffset: Point = { h: 0, w: 0 };
  protected _deselectsSelection: boolean = false;
  protected _overridesPreviousActionOfSameType: boolean = false;
  protected _needsPreviewPixels: boolean = false;

  constructor(public renderIn: 'image' | 'preview' | 'nowhere') {
  }

  public get deselectsSelection() {
    return this._deselectsSelection;
  }

  public getStatePatches(state: TsPaintStoreState): Partial<TsPaintStoreState> {
    let patches: Partial<TsPaintStoreState> = {};

    if (this.renderIn !== 'preview') {
      this.undoActions = this.getUndoActions(state);
    }

    if (this.renderIn === 'preview') {
      this._previewOffset = this.getPreviewOffset(state);
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
    } else {
      patches.previewAction = undefined;
      const actions: TsPaintAction[] = patches.actions || state.actions.map(x => x);
      if (this._overridesPreviousActionOfSameType && !isEmpty(actions) && lastElement(actions).constructor === this.constructor) {
        patches.actions = { ...actions, [actions.length - 1]: this };
      } else {
        patches.actions = actions.concat(this);
      }
    }

    return patches;
  }

  protected abstract addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult;
  protected abstract getUndoActions(state: TsPaintStoreState): TsPaintAction[];

  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    // Override this if necessary
    return { start: { w: 0, h: 0 }, end: { w: 0, h: 0 } };
  }

  protected getPreviewOffset(state: TsPaintStoreState): Point {
    const affectedArea: RectangleArea = this.getAffectedArea(state);
    return affectedArea.start;
  }

  protected getWorkingImage(state: TsPaintStoreState): ImageData {
    let workingImage: ImageData;
    if (this.renderIn === 'preview') {
      const affectedArea: RectangleArea = this.getAffectedArea(state);
      this._previewOffset = affectedArea.start;
      if (this._needsPreviewPixels) {
        workingImage = getImagePart(affectedArea, state.image);
      } else {
        workingImage = new ImageData(getAreaWidth(affectedArea), getAreaHeight(affectedArea));
      }
    } else if (this.renderIn === 'image') {
      workingImage = cloneImage(state.image);
    }

    return workingImage;
  }
}