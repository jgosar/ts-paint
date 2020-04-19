import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';

export interface PartialActionResult {
  image?: ImageData,
  patches?: Partial<TsPaintStoreState>
}