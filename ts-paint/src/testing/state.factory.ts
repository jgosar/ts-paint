import { TsPaintStoreState } from '../app/services/ts-paint/ts-paint.store.state';
import { createImage } from '../app/helpers/image.helpers';
import { WHITE } from './image-test.helpers';

/** A store state with a small white 100x100 image; pass overrides for anything else */
export function createTestState(overrides: Partial<TsPaintStoreState> = {}): TsPaintStoreState {
  const state: TsPaintStoreState = new TsPaintStoreState();
  state.image = createImage(100, 100, WHITE);
  return Object.assign(state, overrides);
}
