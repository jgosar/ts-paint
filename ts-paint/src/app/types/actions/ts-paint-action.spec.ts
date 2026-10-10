import { TsPaintAction } from './ts-paint-action';
import { PartialActionResult } from './partial-action-result';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../base/rectangle-area';
import { Point } from '../base/point';
import { Color } from '../base/color';
import { setPixelInOriginalImage } from '../../helpers/image.helpers';
import { getPixel } from '../../helpers/drawing.helpers';
import { createTestState } from '../../../testing/state.factory';
import { BLACK, RED, WHITE, isColor, alphaAt, setPixel } from '../../../testing/image-test.helpers';

interface TestActionOptions {
  point?: Point;
  area?: RectangleArea;
  overridesPrevious?: boolean;
  needsPreviewPixels?: boolean;
  replacesImage?: boolean;
  drawsImage?: boolean;
  extraPatches?: Partial<TsPaintStoreState>;
}

/** Remembers the color a pixel had before it was painted over, to stand in for a real undo action */
class RestorePixelAction extends TsPaintAction {
  constructor(public readonly restoredColor: Color) {
    super('image');
  }

  protected addPatchesAndDraw(): PartialActionResult {
    return {};
  }

  protected getUndoActions(): TsPaintAction[] {
    return [];
  }
}

/** Paints one black pixel; everything else is configurable so that each base class rule can be exercised */
class PaintPixelAction extends TsPaintAction {
  private readonly _point: Point;
  private readonly _area: RectangleArea | undefined;
  private readonly _drawsImage: boolean;
  private readonly _extraPatches: Partial<TsPaintStoreState> | undefined;

  constructor(renderIn: 'image' | 'preview' | 'nowhere', options: TestActionOptions = {}) {
    super(renderIn);
    this._point = options.point ?? { w: 5, h: 5 };
    this._area = options.area;
    this._drawsImage = options.drawsImage ?? true;
    this._extraPatches = options.extraPatches;
    this._overridesPreviousActionOfSameType = options.overridesPrevious ?? false;
    this._needsPreviewPixels = options.needsPreviewPixels ?? false;
    this._replacesImage = options.replacesImage ?? false;
  }

  /** Exposes the protected helper so that the spec can check what subclasses get to draw on */
  workingImage(state: TsPaintStoreState): ImageData {
    return this.getWorkingImage(state);
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (!this._drawsImage) {
      return { patches: this._extraPatches };
    }
    const image: ImageData = this.getWorkingImage(state);
    const target: Point = this.renderIn === 'preview' ? { w: 0, h: 0 } : this._point;
    setPixelInOriginalImage(target, BLACK, image);
    return { image, patches: this._extraPatches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new RestorePixelAction(getPixel(this._point, state.image))];
  }

  protected getAffectedArea(): RectangleArea {
    return this._area ?? { start: this._point, end: this._point };
  }
}

/** A second class so that "previous action of the same type" can be told apart from "any previous action" */
class OtherAction extends PaintPixelAction {}

describe('TsPaintAction', () => {
  describe('getStatePatches in preview mode', () => {
    it('writes the preview image, its offset and itself as the preview action', () => {
      const action: PaintPixelAction = new PaintPixelAction('preview', {
        area: { start: { w: 10, h: 20 }, end: { w: 12, h: 23 } },
      });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(createTestState());

      expect(patches.previewImage.width).toBe(3);
      expect(patches.previewImage.height).toBe(4);
      expect(patches.previewOffset).toEqual({ w: 10, h: 20 });
      expect(patches.previewAction).toBe(action);
      expect(patches.image).toBeUndefined();
      expect(patches.unsavedChanges).toBeUndefined();
    });

    it('is never logged to history and computes no undo actions', () => {
      const action: PaintPixelAction = new PaintPixelAction('preview');
      const state: TsPaintStoreState = createTestState({ actions: [new OtherAction('image')], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(state, true);

      expect(patches.actions).toBeUndefined();
      expect(patches.undoPointer).toBeUndefined();
      expect(action.undoActions).toEqual([]);
    });
  });

  describe('getStatePatches in image mode', () => {
    it('writes the drawn image, resets the preview to 1x1 and marks the image as changed', () => {
      const action: PaintPixelAction = new PaintPixelAction('image', { point: { w: 5, h: 5 } });
      const state: TsPaintStoreState = createTestState();

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

      expect(isColor({ w: 5, h: 5 }, patches.image, BLACK)).toBe(true);
      expect(isColor({ w: 5, h: 5 }, state.image, WHITE), 'the state image is not drawn on').toBe(true);
      expect(patches.previewImage.width).toBe(1);
      expect(patches.previewImage.height).toBe(1);
      expect(patches.previewOffset).toBeUndefined();
      expect(patches.unsavedChanges).toBe(true);
      expect(patches.previewAction).toBeUndefined();
    });

    it('does not mark the image as changed when the action replaces the whole image', () => {
      const action: PaintPixelAction = new PaintPixelAction('image', { replacesImage: true });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(createTestState());

      expect(action.replacesImage).toBe(true);
      expect(patches.unsavedChanges).toBe(false);
    });

    it('merges the patches returned by the subclass', () => {
      const action: PaintPixelAction = new PaintPixelAction('image', { extraPatches: { zoom: 4 } });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(createTestState());

      expect(patches.zoom).toBe(4);
      expect(patches.image).toBeDefined();
    });

    it('writes no image patches when the subclass draws nothing', () => {
      const action: PaintPixelAction = new PaintPixelAction('nowhere', { drawsImage: false });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(createTestState());

      expect(patches.image).toBeUndefined();
      expect(patches.previewImage).toBeUndefined();
      expect(patches.unsavedChanges).toBeUndefined();
      expect(patches.actions).toEqual([action]);
    });
  });

  describe('history logging', () => {
    it('appends itself to an empty history and moves the undo pointer to 0', () => {
      const action: PaintPixelAction = new PaintPixelAction('image');

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(createTestState());

      expect(patches.actions).toEqual([action]);
      expect(patches.undoPointer).toBe(0);
    });

    it('appends after the current undo pointer and increments it', () => {
      const first: PaintPixelAction = new PaintPixelAction('image');
      const second: PaintPixelAction = new PaintPixelAction('image');
      const state: TsPaintStoreState = createTestState({ actions: [first], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = second.getStatePatches(state);

      expect(patches.actions).toEqual([first, second]);
      expect(patches.undoPointer).toBe(1);
      expect(state.actions, 'the state history array is not mutated').toEqual([first]);
    });

    it('truncates the undone tail of the history', () => {
      const kept: PaintPixelAction = new PaintPixelAction('image');
      const undone1: PaintPixelAction = new PaintPixelAction('image');
      const undone2: PaintPixelAction = new PaintPixelAction('image');
      const fresh: PaintPixelAction = new PaintPixelAction('image');
      const state: TsPaintStoreState = createTestState({ actions: [kept, undone1, undone2], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = fresh.getStatePatches(state);

      expect(patches.actions).toEqual([kept, fresh]);
      expect(patches.undoPointer).toBe(1);
    });

    it('replaces the whole history when everything was undone', () => {
      const undone: PaintPixelAction = new PaintPixelAction('image');
      const fresh: PaintPixelAction = new PaintPixelAction('image');
      const state: TsPaintStoreState = createTestState({ actions: [undone], undoPointer: -1 });

      const patches: Partial<TsPaintStoreState> = fresh.getStatePatches(state);

      expect(patches.actions).toEqual([fresh]);
      expect(patches.undoPointer).toBe(0);
    });

    it('does not touch the history when logToHistory is false', () => {
      const action: PaintPixelAction = new PaintPixelAction('image');
      const state: TsPaintStoreState = createTestState({ actions: [new OtherAction('image')], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(state, false);

      expect(patches.actions).toBeUndefined();
      expect(patches.undoPointer).toBeUndefined();
      expect(patches.previewAction).toBeUndefined();
      expect(patches.image).toBeDefined();
    });

    it('prefers a history returned by the subclass over the one in the state', () => {
      const fromSubclass: PaintPixelAction = new PaintPixelAction('image');
      const action: PaintPixelAction = new PaintPixelAction('image', { extraPatches: { actions: [fromSubclass] } });
      const state: TsPaintStoreState = createTestState({ actions: [new OtherAction('image')], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

      expect(patches.actions).toEqual([fromSubclass, action]);
    });
  });

  describe('undo actions', () => {
    it('are computed from the state before the change when logging', () => {
      const state: TsPaintStoreState = createTestState();
      setPixel(state.image, { w: 5, h: 5 }, RED);
      const action: PaintPixelAction = new PaintPixelAction('image', { point: { w: 5, h: 5 } });

      const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

      expect(action.undoActions.length).toBe(1);
      expect((action.undoActions[0] as RestorePixelAction).restoredColor).toEqual(RED);
      expect(isColor({ w: 5, h: 5 }, patches.image, BLACK)).toBe(true);
    });

    it('are not computed when logToHistory is false', () => {
      const action: PaintPixelAction = new PaintPixelAction('image');

      action.getStatePatches(createTestState(), false);

      expect(action.undoActions).toEqual([]);
    });
  });

  describe('overriding the previous action of the same type', () => {
    it('replaces the previous action in place and inherits its undo actions', () => {
      const state: TsPaintStoreState = createTestState();
      setPixel(state.image, { w: 5, h: 5 }, RED);
      const previous: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const previousPatches: Partial<TsPaintStoreState> = previous.getStatePatches(state);
      const stateAfterPrevious: TsPaintStoreState = createTestState({
        image: previousPatches.image,
        actions: previousPatches.actions,
        undoPointer: previousPatches.undoPointer,
      });
      const next: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });

      const patches: Partial<TsPaintStoreState> = next.getStatePatches(stateAfterPrevious);

      expect(patches.actions).toEqual([next]);
      expect(patches.undoPointer).toBe(0);
      expect(next.undoActions).toBe(previous.undoActions);
      expect((next.undoActions[0] as RestorePixelAction).restoredColor, 'undo goes back to before the first').toEqual(
        RED
      );
    });

    it('only overrides the action at the undo pointer, dropping the undone tail', () => {
      const previous: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const undone: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const next: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const state: TsPaintStoreState = createTestState({ actions: [previous, undone], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = next.getStatePatches(state);

      expect(patches.actions).toEqual([next]);
      expect(patches.undoPointer).toBe(0);
    });

    it('does not override an action of a different class', () => {
      const previous: OtherAction = new OtherAction('image', { overridesPrevious: true });
      const next: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const state: TsPaintStoreState = createTestState({ actions: [previous], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = next.getStatePatches(state);

      expect(patches.actions).toEqual([previous, next]);
      expect(patches.undoPointer).toBe(1);
    });

    it('does not override when the flag is not set', () => {
      const previous: PaintPixelAction = new PaintPixelAction('image');
      const next: PaintPixelAction = new PaintPixelAction('image');
      const state: TsPaintStoreState = createTestState({ actions: [previous], undoPointer: 0 });

      const patches: Partial<TsPaintStoreState> = next.getStatePatches(state);

      expect(patches.actions).toEqual([previous, next]);
      expect(patches.undoPointer).toBe(1);
    });

    it('does not override anything when the whole history has been undone', () => {
      const undone: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const next: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const state: TsPaintStoreState = createTestState({ actions: [undone], undoPointer: -1 });

      let patches: Partial<TsPaintStoreState>;
      expect(() => (patches = next.getStatePatches(state))).not.toThrow();

      expect(patches.actions).toEqual([next]);
      expect(patches.undoPointer).toBe(0);
      expect(next.undoActions).not.toBe(undone.undoActions);
    });

    it('does not override anything when the undo pointer is past the end of the history', () => {
      const previous: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const next: PaintPixelAction = new PaintPixelAction('image', { overridesPrevious: true });
      const state: TsPaintStoreState = createTestState({ actions: [previous], undoPointer: 1 });

      let patches: Partial<TsPaintStoreState>;
      expect(() => (patches = next.getStatePatches(state))).not.toThrow();

      expect(patches.actions).toEqual([previous, next]);
      expect(patches.undoPointer).toBe(2);
    });
  });

  describe('getWorkingImage', () => {
    it('returns an independent clone of the state image in image mode', () => {
      const state: TsPaintStoreState = createTestState();
      setPixel(state.image, { w: 1, h: 1 }, RED);
      const action: PaintPixelAction = new PaintPixelAction('image');

      const working: ImageData = action.workingImage(state);

      expect(working).not.toBe(state.image);
      expect(working.width).toBe(100);
      expect(isColor({ w: 1, h: 1 }, working, RED)).toBe(true);
      setPixel(working, { w: 2, h: 2 }, BLACK);
      expect(isColor({ w: 2, h: 2 }, state.image, WHITE)).toBe(true);
    });

    it('returns a blank transparent image the size of the affected area in preview mode', () => {
      const state: TsPaintStoreState = createTestState();
      setPixel(state.image, { w: 10, h: 10 }, RED);
      const action: PaintPixelAction = new PaintPixelAction('preview', {
        area: { start: { w: 10, h: 10 }, end: { w: 14, h: 12 } },
      });

      const working: ImageData = action.workingImage(state);

      expect(working.width).toBe(5);
      expect(working.height).toBe(3);
      expect(alphaAt({ w: 0, h: 0 }, working)).toBe(0);
      expect(working.data.every((value) => value === 0)).toBe(true);
    });

    it('returns the affected part of the state image when the preview needs its pixels', () => {
      const state: TsPaintStoreState = createTestState();
      setPixel(state.image, { w: 10, h: 10 }, RED);
      const action: PaintPixelAction = new PaintPixelAction('preview', {
        area: { start: { w: 10, h: 10 }, end: { w: 14, h: 12 } },
        needsPreviewPixels: true,
      });

      const working: ImageData = action.workingImage(state);

      expect(working.width).toBe(5);
      expect(working.height).toBe(3);
      expect(isColor({ w: 0, h: 0 }, working, RED)).toBe(true);
      expect(isColor({ w: 1, h: 0 }, working, WHITE)).toBe(true);
      expect(alphaAt({ w: 1, h: 0 }, working)).toBe(255);
    });

    it('returns undefined when the action renders nowhere', () => {
      const action: PaintPixelAction = new PaintPixelAction('nowhere');
      expect(action.workingImage(createTestState())).toBeUndefined();
    });
  });

  describe('deselectsSelection', () => {
    it('is false by default', () => {
      expect(new PaintPixelAction('image').deselectsSelection).toBe(false);
    });
  });
});
