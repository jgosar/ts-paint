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
import { TsPaintAction } from 'src/app/types/actions/ts-paint-action';
import { SetColorAction } from 'src/app/types/actions/set-color-action';
import { SetDrawingToolAction } from 'src/app/types/actions/set-drawing-tool-action';
import { OpenFileAction } from 'src/app/types/actions/open-file-action';
import { ClearImageAction } from 'src/app/types/actions/clear-image-action';
import { Object as TsObject } from 'ts-toolbelt';
import { PasteImageAction } from 'src/app/types/actions/paste-image-action';
import { RectangleArea } from 'src/app/types/base/rectangle-area';
import { isPointInRectangle } from 'src/app/helpers/image.helpers';
import { DeselectSelectionAction } from 'src/app/types/actions/deselect-selection-action';
import { MoveSelectionTool } from 'src/app/types/drawing-tools/move-selection-tool';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState>{
  constructor(private tsPaintService: TsPaintService) {
    super(new TsPaintStoreState());
  }

  processMouseDown(event: MouseButtonEvent) {
    if (this.state.selectionImage !== undefined) {
      if (this.isPointInSelection(event.point)) {
        if (!this.state.moveSelectionTool) {
          this.patchState(new MoveSelectionTool(this.state.selectionOffset, this.executeAction.bind(this)), 'moveSelectionTool');
        }
        this.state.moveSelectionTool.mouseDown(event);
      } else {
        const action: DeselectSelectionAction = new DeselectSelectionAction();
        this.executeAction(action);
        this.state.selectedDrawingTool?.mouseDown(event);
      }
    } else {
      this.state.selectedDrawingTool?.mouseDown(event);
    }
  }

  processMouseUp(point: Point) {
    if (this.state.moveSelectionTool !== undefined) {
      this.state.moveSelectionTool.mouseUp(point);
    } else {
      this.state.selectedDrawingTool?.mouseUp(point);
    }
  }

  processMouseMove(point: Point) {
    if (this.state.moveSelectionTool !== undefined) {
      this.state.moveSelectionTool.mouseMove(point);
    } else {
      this.state.selectedDrawingTool?.mouseMove(point);
    }
  }

  executeMenuAction(menuAction: MenuActionType) {
    const menuActionFunction: () => void = this.getMenuActionFunction(menuAction);
    menuActionFunction();
  }

  setDrawingTool(toolType: DrawingToolType) {
    const action: SetDrawingToolAction = new SetDrawingToolAction(toolType, this.getDrawingTool.bind(this));
    this.executeAction(action);
  }

  setColor(selection: ColorSelection) {
    const action: SetColorAction = new SetColorAction(selection);
    this.executeAction(action);
  }

  processMouseScroll(event: MouseWheelEvent) {
    //TODO: Zooming
  }

  private getDrawingTool(toolType: DrawingToolType): DrawingTool {
    return new DrawingTool(toolType, this.executeAction.bind(this));
  }

  private executeAction(action: TsPaintAction, logToHistory: boolean = true) {
    const patches: Partial<TsPaintStoreState> = action.getStatePatches(this.state, logToHistory);

    if (this.state.selectionImage !== undefined && action.deselectsSelection) {
      this.executeAction(new DeselectSelectionAction(), false);
    }

    Object.keys(patches).forEach(key => {
      const key2 = key as keyof TsObject.Path<TsPaintStoreState, []>;
      this.patchState(patches[key], key2);
    });
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

  private openFile() {
    this.tsPaintService.openFile().then(value => {
      const action: OpenFileAction = new OpenFileAction(value);
      this.executeAction(action);
    });
  }

  pasteFile(pastedFile: File) {
    if (pastedFile !== null) {
      this.tsPaintService.pasteFile(pastedFile).then(pastedImage => {
        const action: PasteImageAction = new PasteImageAction(pastedImage);
        this.executeAction(action);
      });
    }
  }

  private saveFile() {
    this.tsPaintService.saveFile({ imageData: this.state.image, fileName: this.state.fileName });
  }

  private undo() {
    if (this.state.undoPointer >= 0) {
      const undoPointer: number = this.state.undoPointer;
      const actionToUndo: TsPaintAction = this.state.actions[undoPointer];
      actionToUndo.undoActions.forEach(undoAction => {
        this.executeAction(undoAction, false);
      });

      this.patchState(undoPointer - 1, 'undoPointer');
    }
  }

  private repeat() {
  }

  private clearImage() {
    const action: ClearImageAction = new ClearImageAction();
    this.executeAction(action);
  }

  private isPointInSelection(point: Point): boolean {
    const selectionRectangleWith3pxBorder: RectangleArea = {
      start: {
        w: this.state.selectionOffset.w - 3,
        h: this.state.selectionOffset.h - 3
      },
      end: {
        w: this.state.selectionOffset.w + this.state.selectionImage.width - 1 + 3,
        h: this.state.selectionOffset.h + this.state.selectionImage.height - 1 + 3
      }
    };

    return isPointInRectangle(point, selectionRectangleWith3pxBorder);
  }
}