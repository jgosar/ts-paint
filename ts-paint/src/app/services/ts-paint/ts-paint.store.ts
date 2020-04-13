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
import { MouseButtonEvent } from 'src/app/types/mouse-tracker/mouse-button-event';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { DrawingTool } from 'src/app/types/drawing-tools/drawing-tool';
import { DrawingToolAction } from 'src/app/types/drawing-tools/drawing-tool-action';
import { drawLine } from 'src/app/helpers/drawing.helpers';
import { cloneImage } from 'src/app/helpers/image.helpers';

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

  setDrawingTool(toolType: DrawingToolType) {
    this.patchState(this.getDrawingTool(toolType), 'selectedDrawingTool');
  }

  processMouseDown(event: MouseButtonEvent) {
    this.state.selectedDrawingTool?.mouseDown(event);
  }

  processMouseUp(point: Point) {
    this.state.selectedDrawingTool?.mouseUp(point);
  }

  processMouseMove(point: Point) {
    this.state.selectedDrawingTool?.mouseMove(point);
  }

  processMouseScroll(event: MouseWheelEvent) {
    //TODO: Zooming
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

  private getDrawingTool(toolType: DrawingToolType): DrawingTool {
    return new DrawingTool(toolType, this.addDrawingToolAction.bind(this));
  }

  private addDrawingToolAction(action: DrawingToolAction) {
    if (action.preview) {
      this.patchState(action, 'previewAction');
    } else {
      this.patchState(undefined, 'previewAction');
      this.patchState(this.state.actions.concat(action), 'actions');
    }

    this.executeDrawingToolAction(action);
  }

  private executeDrawingToolAction(action: DrawingToolAction) {
    const image: ImageData = action.preview ? new ImageData(this.state.image.width, this.state.image.height) : cloneImage(this.state.image);

    switch (action.tool) {
      case DrawingToolType.line:
        drawLine(action.points[0], action.points[1], this.state.primaryColor, image);
        this.patchState(image, action.preview ? 'previewImage' : 'image');
        return;
    }

    assertUnreachable(action.tool);
  }

  private openFile() {
    this.tsPaintService.openFile().then(value => {
      this.setImage(value.imageData);
      this.patchState(value.fileName, 'fileName');
    });
  }

  private saveFile() {
    this.tsPaintService.saveFile({ imageData: this.state.image, fileName: this.state.fileName });
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