import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from 'rxjs-observable-store';
import { MenuActionType } from 'src/app/types/menu/menu-action-type';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';
import { Point } from 'src/app/types/base/point';
import { TsPaintService } from './ts-paint.service';
import { MouseButtonEvent } from 'src/app/types/mouse-tracker/mouse-button-event';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { DrawingTool } from 'src/app/types/drawing-tools/drawing-tool';
import { ColorSelection } from 'src/app/types/base/color-selection';
import { DrawLineExecutor } from 'src/app/types/actions/drawing-tool-actions/draw-line/draw-line-executor';
import { TsPaintStatePatch } from './ts-paint-state-patch';
import { DrawPencilExecutor } from 'src/app/types/actions/drawing-tool-actions/draw-pencil/draw-pencil-executor';
import { ActionExecutor } from 'src/app/types/actions/action-executor';
import { TsPaintActionType } from 'src/app/types/actions/ts-paint-action-type';
import { TsPaintAction } from 'src/app/types/actions/ts-paint-action';
import { SetColorAction, createSetColorAction } from 'src/app/types/actions/set-color/set-color-action';
import { SetColorExecutor } from 'src/app/types/actions/set-color/set-color-executor';
import { SetDrawingToolExecutor } from 'src/app/types/actions/set-drawing-tool/set-drawing-tool-executor';
import { createSetDrawingToolAction, SetDrawingToolAction } from 'src/app/types/actions/set-drawing-tool/set-drawing-tool-action';
import { OpenFileAction, createOpenFileAction } from 'src/app/types/actions/open-file/open-file-action';
import { OpenFileExecutor } from 'src/app/types/actions/open-file/open-file-executor';
import { ClearImageAction, createClearImageAction } from 'src/app/types/actions/clear-image/clear-image-action';
import { ClearImageExecutor } from 'src/app/types/actions/clear-image/clear-image-executor';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState>{
  constructor(private tsPaintService: TsPaintService) {
    super(new TsPaintStoreState());
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

  executeMenuAction(menuAction: MenuActionType) {
    const menuActionFunction: () => void = this.getMenuActionFunction(menuAction);
    menuActionFunction();
  }

  setDrawingTool(toolType: DrawingToolType) {
    const action: SetDrawingToolAction = createSetDrawingToolAction(toolType);
    this.executeAction(action);
  }

  setColor(selection: ColorSelection) {
    const action: SetColorAction = createSetColorAction(selection);
    this.executeAction(action);
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

  private getActionExecutor(actionType: TsPaintActionType) {
    switch (actionType) {
      case TsPaintActionType.DRAW_PENCIL: return new DrawPencilExecutor(() => this.state);
      case TsPaintActionType.DRAW_LINE: return new DrawLineExecutor(() => this.state);
      case TsPaintActionType.SET_COLOR: return new SetColorExecutor(() => this.state);
      case TsPaintActionType.SET_DRAWING_TOOL: return new SetDrawingToolExecutor(() => this.state, this.getDrawingTool.bind(this));
      case TsPaintActionType.OPEN_FILE: return new OpenFileExecutor(() => this.state);
      case TsPaintActionType.CLEAR_IMAGE: return new ClearImageExecutor(() => this.state);
    }

    assertUnreachable(actionType);
  }

  private getDrawingTool(toolType: DrawingToolType): DrawingTool {
    return new DrawingTool(toolType, this.executeAction.bind(this));
  }

  private executeAction(action: TsPaintAction) {
    let patches: TsPaintStatePatch<any>[];
    let executor: ActionExecutor<any> = this.getActionExecutor(action.type);

    patches = executor.execute(action);
    patches.forEach(patch => {
      this.patchState(patch.value, patch.property);
    });
  }

  private openFile() {
    this.tsPaintService.openFile().then(value => {
      const action: OpenFileAction = createOpenFileAction(value);
      this.executeAction(action);
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
    const action: ClearImageAction = createClearImageAction();
    this.executeAction(action);
  }
}