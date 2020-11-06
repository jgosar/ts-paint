import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { DrawingToolAction } from './drawing-tool-action';

export abstract class SimpleDrawingToolAction extends DrawingToolAction<void> {
  protected getMeta(state: TsPaintStoreState): void{

  }
  
  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const color1: Color = this.swapColors ? state.secondaryColor : state.primaryColor;
    const color2: Color = this.swapColors ? state.primaryColor : state.secondaryColor;

    const patches: Partial<TsPaintStoreState> = this.addPatches(state);
    const image: ImageData = this.getWorkingImage(state);
    this.draw(this.getOffsetPoints(), color1, color2, image, state, this.getMeta(state));

    return { patches, image };
  }
}
