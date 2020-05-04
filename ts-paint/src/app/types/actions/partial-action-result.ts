import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';

export interface PartialActionResult {
  image?: ImageData,
  patches?: Partial<TsPaintStoreState>
}