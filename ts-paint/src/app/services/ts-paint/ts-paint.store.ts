import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from 'rxjs-observable-store';
import { MenuActionType } from 'src/app/types/menu/menu-action-type';
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
import { drawLine, drawLines } from 'src/app/helpers/drawing.helpers';
import { cloneImage } from 'src/app/helpers/image.helpers';
import { ColorSelection } from 'src/app/types/base/color-selection';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState>{
  constructor(private tsPaintService: TsPaintService) {
    super(new TsPaintStoreState());
  }

  executeMenuAction(menuAction: MenuActionType) {
    const menuActionFunction: () => void = this.getMenuActionFunction(menuAction);
    menuActionFunction();
  }

  setDrawingTool(toolType: DrawingToolType) {
    this.patchState(this.getDrawingTool(toolType), 'selectedDrawingTool');
  }

  setColor(selection: ColorSelection) {
    if (selection.primary) {
      this.patchState(selection.color, 'primaryColor');
    } else {
      this.patchState(selection.color, 'secondaryColor');
    }
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

  private getMenuActionFunction(menuAction: MenuActionType): () => void {
    switch (menuAction) {
      case MenuActionType.OPEN_FILE: return this.openFile.bind(this);
      case MenuActionType.SAVE_FILE: return this.saveFile.bind(this);
      case MenuActionType.UNDO: return this.undo.bind(this);
      case MenuActionType.REPEAT: return this.repeat.bind(this);
      case MenuActionType.CLEAR_IMAGE: return this.clearImage.bind(this);
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
    let image: ImageData;
    if (action.preview) {
      const minW: number = Math.min(...action.points.map(x => x.w));
      const maxW: number = Math.max(...action.points.map(x => x.w));
      const minH: number = Math.min(...action.points.map(x => x.h));
      const maxH: number = Math.max(...action.points.map(x => x.h));

      image = new ImageData(1 + maxW - minW, 1 + maxH - minH);
      action = this.cropAction(action, minW, minH);

      this.patchState(minW, 'previewOffsetW');
      this.patchState(minH, 'previewOffsetH');
    } else {
      image = cloneImage(this.state.image);
    }

    const color: Color = action.swapColors ? this.state.secondaryColor : this.state.primaryColor;

    switch (action.tool) {
      case DrawingToolType.pencil:
        drawLines(action.points, color, image);
        break;
      case DrawingToolType.line:
        drawLine(action.points[0], action.points[1], color, image);
        break;
      default:
        assertUnreachable(action.tool);
    }

    if (action.preview) {
      this.patchState(image, 'previewImage');
    } else {
      this.patchState(image, 'image');
      this.patchState(new ImageData(1, 1), 'previewImage');
    }
  }

  private cropAction(action: DrawingToolAction, offsetW: number, offsetH: number): DrawingToolAction {
    return {
      ...action,
      points: action.points.map(point => { return { w: point.w - offsetW, h: point.h - offsetH }; })
    };
  }

  private openFile() {
    this.tsPaintService.openFile().then(value => {
      this.patchState(value.imageData, 'image');
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