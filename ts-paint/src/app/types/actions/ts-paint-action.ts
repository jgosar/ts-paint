import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { Path } from 'Object/Path';
import { Point } from '../base/point';
import { getAreaWidth, getAreaHeight, cloneImage } from 'src/app/helpers/image.helpers';

export abstract class TsPaintAction {
  public undoActions: TsPaintAction[] = [];
  private _patches: TsPaintStatePatch<any>[];
  protected _previewOffset: Point = { h: 0, w: 0 };

  constructor(public renderIn: 'image' | 'preview' | 'nowhere') {
  }

  public getStatePatches(state: TsPaintStoreState): TsPaintStatePatch<any>[] {
    this._patches = [];

    this.undoActions = this.getUndoActions(state);

    if (this.renderIn === 'preview') {
      this._previewOffset = this.getPreviewOffset();
    }

    let image: ImageData | undefined = this.addPatchesAndDraw(state);

    if (image !== undefined) {
      if (this.renderIn === 'preview') {
        this.addPatch(image, 'previewImage');
        this.addPatch(this._previewOffset, 'previewOffset');
      } else if (this.renderIn === 'image') {
        this.addPatch(image, 'image');
        this.addPatch(new ImageData(1, 1), 'previewImage');
      }
    }

    if (this.renderIn === 'preview') {
      this.addPatch(this, 'previewAction');
    } else if (this.renderIn === 'image') {
      this.addPatch(undefined, 'previewAction');
      this.addPatch(state.actions.concat(this), 'actions');
    }

    return this._patches;
  }

  protected abstract addPatchesAndDraw(state: TsPaintStoreState): ImageData | undefined; // TODO: return patches from the function?
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

  protected addPatch<P1 extends keyof Path<TsPaintStoreState, []>>(
    value: Path<TsPaintStoreState, [P1]>,
    property: P1
  ) {
    this._patches.push({ value, property });
  }
}