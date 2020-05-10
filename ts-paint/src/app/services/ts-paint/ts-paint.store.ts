import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from 'rxjs-observable-store';
import { MenuActionType } from '../../types/menu/menu-action-type';
import { assertUnreachable } from '../../helpers/typescript.helpers';
import { Point } from '../../types/base/point';
import { MouseButtonEvent } from '../../types/mouse-tracker/mouse-button-event';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { DrawingTool } from '../../types/drawing-tools/drawing-tool';
import { ColorSelection } from '../../types/base/color-selection';
import { TsPaintAction } from '../../types/actions/ts-paint-action';
import { SetColorAction } from '../../types/actions/set-color-action';
import { SetDrawingToolAction } from '../../types/actions/set-drawing-tool-action';
import { OpenFileAction } from '../../types/actions/open-file-action';
import { ClearImageAction } from '../../types/actions/clear-image-action';
import { Object as TsObject } from 'ts-toolbelt';
import { PasteImageAction } from '../../types/actions/paste-image-action';
import { RectangleArea } from '../../types/base/rectangle-area';
import { isPointInRectangle, copyImagePart } from '../../helpers/image.helpers';
import { DeselectSelectionAction } from '../../types/actions/deselect-selection-action';
import { MoveSelectionTool } from '../../types/drawing-tools/move-selection-tool';
import { saveFile, openFile, pasteFile } from '../../helpers/image-file.helpers';
import { ResizeImageAction } from '../../types/actions/resize-image-action';
import { findMenuActionTypeByHotkeyEvent } from 'src/app/types/menu/menu-hotkey.helpers';
import { RectangleSelectAction } from 'src/app/types/actions/drawing-tool-actions/rectangle-select-action';
import { DeleteSelectionAction } from 'src/app/types/actions/delete-selection-action';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState>{
  constructor() {
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
    this.patchState(point, 'mousePosition');
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

  executeHotkeyAction(event: KeyboardEvent): boolean {
    const hotkeyActionFunction: () => void = this.getHotkeyActionFunction(event);

    if (hotkeyActionFunction) {
      hotkeyActionFunction();
      return true;
    } else {
      return false;
    }
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

  changeAttributes(dimensions: Point) {
    this.closeAttributesWindow();
    const action: ResizeImageAction = new ResizeImageAction(dimensions.w, dimensions.h);
    this.executeAction(action);
  }

  closeAttributesWindow() {
    this.patchState(false, 'attributesWindowOpen');
  }

  private getDrawingTool(toolType: DrawingToolType): DrawingTool {
    return new DrawingTool(toolType, this.executeAction.bind(this));
  }

  private executeAction(action: TsPaintAction, logToHistory: boolean = true) {
    const patches: Partial<TsPaintStoreState> = action.getStatePatches(this.state, logToHistory);

    if (action.deselectsSelection) {
      this.deselectIfSelected();
    }

    Object.keys(patches).forEach(key => {
      const key2 = key as keyof TsObject.Path<TsPaintStoreState, []>;
      this.patchState(patches[key], key2);
    });
  }

  private deselectIfSelected() {
    if (this.state.selectionImage !== undefined) {
      this.executeAction(new DeselectSelectionAction(), false);
    }
  }

  private getMenuActionFunction(menuAction: MenuActionType): () => void {
    switch (menuAction) {
      case MenuActionType.OPEN_FILE: return this.openFile.bind(this);
      case MenuActionType.SAVE_FILE: return this.saveFile.bind(this);
      case MenuActionType.UNDO: return this.undo.bind(this);
      case MenuActionType.REPEAT: return this.repeat.bind(this);
      case MenuActionType.COPY: return this.copy.bind(this);
      case MenuActionType.CLEAR_IMAGE: return this.clearImage.bind(this);
      case MenuActionType.OPEN_ATTRIBUTES_WINDOW: return this.openAttributesWindow.bind(this);
      case MenuActionType.SELECT_ALL: return this.selectAll.bind(this);
      case MenuActionType.CLEAR_SELECTION: return this.clearSelection.bind(this);
      case MenuActionType.DESELECT: return this.deselectIfSelected.bind(this);
    }

    assertUnreachable(menuAction);
  }

  private getHotkeyActionFunction(event: KeyboardEvent): () => void | undefined {
    const menuAction: MenuActionType = findMenuActionTypeByHotkeyEvent([...this.state.menuStructure, ...this.state.hiddenHotkeyShortcuts], event);
    if (menuAction) {
      return this.getMenuActionFunction(menuAction);
    }
  }

  private openFile() {
    openFile().then(value => {
      const action: OpenFileAction = new OpenFileAction(value);
      this.executeAction(action);
    });
  }

  pasteFile(pastedFile: File) {
    if (pastedFile !== null) {
      pasteFile(pastedFile).then(pastedImage => {
        const action: PasteImageAction = new PasteImageAction(pastedImage);
        this.executeAction(action);
      });
    }
  }

  copy() {
    if (this.state.selectionImage) {
      copyImagePart(this.state.selectionImage);
    }
  }

  private saveFile() {
    this.deselectIfSelected();
    saveFile({ imageData: this.state.image, fileName: this.state.fileName });
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
    if (this.state.undoPointer < this.state.actions.length - 1) {
      const undoPointer: number = this.state.undoPointer;
      const actionToRepeat: TsPaintAction = this.state.actions[undoPointer + 1];
      this.executeAction(actionToRepeat, false);
      this.patchState(undoPointer + 1, 'undoPointer');
    }
  }

  private clearImage() {
    const action: ClearImageAction = new ClearImageAction();
    this.executeAction(action);
  }

  private selectAll() {
    const action: RectangleSelectAction = new RectangleSelectAction([{ w: 0, h: 0 }, { w: this.state.image.width - 1, h: this.state.image.height - 1 }], false, 'image');
    this.executeAction(action);
  }

  private clearSelection() {
    const action: DeleteSelectionAction = new DeleteSelectionAction();
    this.executeAction(action);
  }

  private openAttributesWindow() {
    this.patchState(true, 'attributesWindowOpen');
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