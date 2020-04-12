import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from 'rxjs-observable-store';
import { MenuAction } from 'src/app/types/menu/menu-action';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';
import { PaintableColor } from 'src/app/types/base/paintable-color';
import { Color } from 'src/app/types/base/color';
import { Point } from 'src/app/types/base/point';
import { ImageSelection } from 'src/app/types/base/image-selection';
import { TsPaintService } from './ts-paint.service';
import { FileUploadEvent } from 'src/app/types/file-upload/file-upload-event';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState>{
  constructor(private tsPaintService: TsPaintService) {
    super(new TsPaintStoreState());
  }

  executeMenuAction(menuAction: MenuAction) {
    const menuActionFunction: () => void = this.getMenuActionFunction(menuAction);
    menuActionFunction();
  }

  setImage(image: ImageData) {
    this.patchState(image, 'image');
  }

  imageUploaded(upload: FileUploadEvent) {
    this.setImage(upload.imageData);
    this.patchState(upload.fileName, 'fileName');
  }

  private getMenuActionFunction(menuAction: MenuAction): () => void {
    switch (menuAction) {
      case MenuAction.OPEN_FILE: return this.openFile.bind(this);
      case MenuAction.SAVE_FILE: return this.saveFile.bind(this);
      case MenuAction.UNDO: return this.undo.bind(this);
      case MenuAction.REPEAT: return this.repeat.bind(this);
      case MenuAction.CLEAR_IMAGE: return this.clearImage.bind(this);
    }

    assertUnreachable(menuAction);
  }

  private openFile() {
    this.tsPaintService.openFileUploadDialog();
  }

  private saveFile() {

  }

  private undo() {

  }

  private repeat() {

  }

  private clearImage() {

  }

  paintArea(minW: number, minH: number, maxW: number, maxH: number, color?: PaintableColor): void {

  }
  saveChanges(): void {

  }

  clearChanges(): void {

  }

  getImageData(): ImageData {
    return undefined;
  }
  batchPaintPixels(pixels: number[][]): void {

  }
  setSelectedColor(color: Color, primary: boolean): void {

  }
  /*imageSelection: ImageData{

  }
  initialSelectionLocation: Point{

  }*/
  pasteImage(imageSelection: ImageData, w: number, h: number): void {

  }
  setSelection(startPoint: Point, endPoint: Point): void {

  }

  getSelection(): ImageSelection {
    return undefined;
  }
}