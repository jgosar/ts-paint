import { ColorPickerAction } from './color-picker-action';
import { SetColorAction } from '../set-color-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../../testing/state.factory';
import { BLACK, BLUE, GREEN, RED, setPixel, WHITE } from '../../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../../testing/action-test.helpers';

function stateWithRedPixel(): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({ primaryColor: BLACK, secondaryColor: WHITE });
  setPixel(state.image, { w: 5, h: 5 }, RED);
  return state;
}

describe('ColorPickerAction', () => {
  it('picks the clicked pixel as the primary color with the left button', () => {
    const state: TsPaintStoreState = stateWithRedPixel();

    const patches: Partial<TsPaintStoreState> = new ColorPickerAction([{ w: 5, h: 5 }], false, 'image').getStatePatches(
      state
    );

    expect(patches.primaryColor).toEqual(RED);
    expect('secondaryColor' in patches).toBe(false);
  });

  it('picks the clicked pixel as the secondary color with the right button', () => {
    const state: TsPaintStoreState = stateWithRedPixel();

    const patches: Partial<TsPaintStoreState> = new ColorPickerAction([{ w: 5, h: 5 }], true, 'image').getStatePatches(
      state
    );

    expect(patches.secondaryColor).toEqual(RED);
    expect('primaryColor' in patches).toBe(false);
  });

  it('does not change any pixel', () => {
    const state: TsPaintStoreState = stateWithRedPixel();

    const patches: Partial<TsPaintStoreState> = new ColorPickerAction([{ w: 5, h: 5 }], false, 'image').getStatePatches(
      state
    );

    expect(imagesEqual(patches.image, state.image)).toBe(true);
  });

  it('undoes by restoring the previous color of the same slot', () => {
    const state: TsPaintStoreState = stateWithRedPixel();
    state.primaryColor = GREEN;
    state.secondaryColor = BLUE;
    const action: ColorPickerAction = new ColorPickerAction([{ w: 5, h: 5 }], true, 'image');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([SetColorAction]);
    expect(restored.secondaryColor).toEqual(BLUE);
    expect(restored.primaryColor).toEqual(GREEN);
  });
});
