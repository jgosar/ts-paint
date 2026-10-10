import { LineAction } from './line-action';
import { RectangleAction } from './rectangle-action';
import { EllipseAction } from './ellipse-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { createImage } from '../../../helpers/image.helpers';
import { Point } from '../../base/point';
import { COLOR_WHITE, DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';

function stateWithThickness(thickness: number): TsPaintStoreState {
  const state: TsPaintStoreState = new TsPaintStoreState();
  state.image = createImage(100, 100, COLOR_WHITE);
  state.drawingToolOptions = { ...DEFAULT_DRAWING_TOOL_OPTIONS, [DrawingToolType.line]: { thickness } };
  return state;
}

function isBlack(point: Point, image: ImageData): boolean {
  const offset: number = 4 * (point.w + image.width * point.h);
  const [r, g, b, a]: number[] = Array.from(image.data.slice(offset, offset + 4));
  return r === 0 && g === 0 && b === 0 && a === 255;
}

describe('LineAction', () => {
  it('pads the preview image by the line thickness', () => {
    const state: TsPaintStoreState = stateWithThickness(5);
    const action: LineAction = new LineAction(
      [
        { w: 20, h: 50 },
        { w: 40, h: 50 },
      ],
      false,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 18, h: 48 });
    expect(patches.previewImage.width).toBe(25);
    expect(patches.previewImage.height).toBe(5);
    expect(isBlack({ w: 0, h: 2 }, patches.previewImage)).toBe(true);
    expect(isBlack({ w: 12, h: 0 }, patches.previewImage)).toBe(true);
    expect(isBlack({ w: 12, h: 4 }, patches.previewImage)).toBe(true);
  });

  it('never lets the preview offset go negative at the image edge', () => {
    const state: TsPaintStoreState = stateWithThickness(5);
    const action: LineAction = new LineAction(
      [
        { w: 0, h: 0 },
        { w: 10, h: 0 },
      ],
      false,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 0, h: 0 });
    expect(patches.previewImage.width).toBe(13);
    expect(patches.previewImage.height).toBe(3);
    expect(isBlack({ w: 0, h: 0 }, patches.previewImage)).toBe(true);
  });

  it('draws a thick line into the image', () => {
    const state: TsPaintStoreState = stateWithThickness(3);
    const action: LineAction = new LineAction(
      [
        { w: 20, h: 50 },
        { w: 40, h: 50 },
      ],
      false,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isBlack({ w: 30, h: 49 }, patches.image)).toBe(true);
    expect(isBlack({ w: 30, h: 51 }, patches.image)).toBe(true);
    expect(isBlack({ w: 30, h: 52 }, patches.image)).toBe(false);
  });

  it('undo restores the pixels covered by the thick line', () => {
    const state: TsPaintStoreState = stateWithThickness(5);
    const action: LineAction = new LineAction(
      [
        { w: 20, h: 50 },
        { w: 40, h: 50 },
      ],
      false,
      'image'
    );

    action.getStatePatches(state);

    const pasteAction: any = action.undoActions[0];
    expect(pasteAction['_imagePart'].width).toBe(25);
    expect(pasteAction['_imagePart'].height).toBe(5);
  });
});

describe('RectangleAction', () => {
  it('draws the border inward using the line thickness', () => {
    const state: TsPaintStoreState = stateWithThickness(5);
    const action: RectangleAction = new RectangleAction(
      [
        { w: 10, h: 10 },
        { w: 50, h: 50 },
      ],
      false,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isBlack({ w: 10, h: 30 }, patches.image)).toBe(true);
    expect(isBlack({ w: 14, h: 30 }, patches.image)).toBe(true);
    expect(isBlack({ w: 15, h: 30 }, patches.image)).toBe(false);
    expect(isBlack({ w: 9, h: 30 }, patches.image)).toBe(false);
  });

  it('keeps the preview inside the dragged box', () => {
    const state: TsPaintStoreState = stateWithThickness(5);
    const action: RectangleAction = new RectangleAction(
      [
        { w: 10, h: 10 },
        { w: 50, h: 50 },
      ],
      false,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 10, h: 10 });
    expect(patches.previewImage.width).toBe(41);
    expect(isBlack({ w: 4, h: 20 }, patches.previewImage)).toBe(true);
    expect(isBlack({ w: 5, h: 20 }, patches.previewImage)).toBe(false);
  });
});

describe('EllipseAction', () => {
  it('draws a thick ring using the line thickness', () => {
    const state: TsPaintStoreState = stateWithThickness(5);
    const action: EllipseAction = new EllipseAction(
      [
        { w: 10, h: 10 },
        { w: 50, h: 40 },
      ],
      false,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isBlack({ w: 10, h: 25 }, patches.image)).toBe(true);
    expect(isBlack({ w: 14, h: 25 }, patches.image)).toBe(true);
    expect(isBlack({ w: 15, h: 25 }, patches.image)).toBe(false);
  });
});
