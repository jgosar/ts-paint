import { TextBoxAction } from './text-box-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../../testing/state.factory';
import { execute } from '../../../../testing/action-test.helpers';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';
import { areaSize } from '../../../helpers/area.helpers';
import { getFontMetrics } from '../../../helpers/text.helpers';
import { isColor, WHITE } from '../../../../testing/image-test.helpers';
import { createImage } from '../../../helpers/image.helpers';

function state(): TsPaintStoreState {
  return createTestState({
    image: createImage(300, 200),
    drawingToolOptions: {
      ...DEFAULT_DRAWING_TOOL_OPTIONS,
      [DrawingToolType.text]: { fontFamily: 'monospace', fontSize: 10, bold: false, italic: false, underline: false },
    },
  });
}

describe('TextBoxAction', () => {
  it('previews the dragged rectangle as a dashed outline', () => {
    const patches: Partial<TsPaintStoreState> = new TextBoxAction(
      [
        { w: 10, h: 10 },
        { w: 30, h: 20 },
      ],
      false,
      'preview'
    ).getStatePatches(state());

    expect(patches.previewOffset).toEqual({ w: 10, h: 10 });
    expect([patches.previewImage.width, patches.previewImage.height]).toEqual([21, 11]);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, WHITE)).toBe(true);
    expect(patches.previewImage.data[4 * 5 + 3], 'the outline is dashed').toBe(0);
    expect(patches.textBox).toBeUndefined();
    expect(patches.actions).toBeUndefined();
  });

  it('opens an empty text box over the dragged rectangle and clears the preview', () => {
    const before: TsPaintStoreState = state();
    const patches: Partial<TsPaintStoreState> = new TextBoxAction(
      [
        { w: 60, h: 50 },
        { w: 10, h: 10 },
      ],
      false,
      'image'
    ).getStatePatches(before);

    expect(patches.textBox).toEqual({ area: { start: { w: 10, h: 10 }, end: { w: 60, h: 50 } }, text: '' });
    expect([patches.previewImage.width, patches.previewImage.height]).toEqual([1, 1]);
    expect(patches.image, 'the picture does not change').toBeUndefined();
  });

  it('is not an undo step', () => {
    const before: TsPaintStoreState = state();
    const after: TsPaintStoreState = execute(
      new TextBoxAction(
        [
          { w: 10, h: 10 },
          { w: 10, h: 10 },
        ],
        false,
        'image'
      ),
      before
    );

    expect(after.actions).toBe(before.actions);
    expect(after.undoPointer).toBe(before.undoPointer);
    expect(after.unsavedChanges).toBe(false);
  });

  it('gives a box made with a click the default size', () => {
    const textBox = execute(new TextBoxAction([{ w: 10, h: 10 }], false, 'image'), state()).textBox;
    const lineHeight: number = getFontMetrics(state().drawingToolOptions[DrawingToolType.text]).lineHeight;
    expect(areaSize(textBox.area)).toEqual({ w: 150, h: lineHeight });
  });
});
