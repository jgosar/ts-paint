import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from 'rxjs-observable-store';
import { MenuActionType } from '../../types/menu/menu-action-type';
import { assertUnreachable, isDefined } from '../../helpers/typescript.helpers';
import { Point } from '../../types/base/point';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { DrawingTool } from '../../types/drawing-tools/drawing-tool';
import { ColorSelection } from '../../types/base/color-selection';
import { TsPaintAction } from '../../types/actions/ts-paint-action';
import { SetColorAction } from '../../types/actions/set-color-action';
import { SetDrawingToolAction } from '../../types/actions/set-drawing-tool-action';
import { OpenFileAction } from '../../types/actions/open-file-action';
import { ClearImageAction } from '../../types/actions/clear-image-action';
import { PasteImageAction } from '../../types/actions/paste-image-action';
import { RectangleArea } from '../../types/base/rectangle-area';
import { isPointInRectangle, copyImagePart, unzoomPoint } from '../../helpers/image.helpers';
import { DeselectSelectionAction } from '../../types/actions/deselect-selection-action';
import { MoveSelectionTool } from '../../types/drawing-tools/move-selection-tool';
import {
  saveFile,
  showFileUploadDialog,
  readImageDataFromFile,
  getFileNameWithoutExtension,
  readImageDataFromUrl,
} from '../../helpers/image-file.helpers';
import { ResizeImageAction } from '../../types/actions/resize-image-action';
import { findMenuActionTypeByHotkeyEvent } from 'src/app/types/menu/menu-hotkey.helpers';
import { RectangleSelectAction } from 'src/app/types/actions/drawing-tool-actions/rectangle-select-action';
import { DeleteSelectionAction } from 'src/app/types/actions/delete-selection-action';
import { InvertColorsAction } from 'src/app/types/actions/invert-colors-action';
import { FlipImageAction } from 'src/app/types/actions/flip-image-action';
import { FlipRotateParams } from 'src/app/types/action-params/flip-rotate-params';
import { RotateImageAction } from 'src/app/types/actions/rotate-image-action';
import { TspMouseEvent } from 'src/app/types/mouse-tracker/tsp-mouse-event';
import { CropAction } from 'src/app/types/actions/crop-action';
import { StretchSkewParams } from 'src/app/types/action-params/stretch-skew-params';
import { StretchImageAction } from 'src/app/types/actions/stretch-image-action';
import { ImageFileData } from 'src/app/types/base/image-file-data';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { SetDrawingToolOptionsAction } from 'src/app/types/actions/set-drawing-tool-options-action';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState> {
  constructor() {
    super(new TsPaintStoreState());
  }

  ////////////////////////////// Mouse actions //////////////////////////////
  processMouseDown(event: TspMouseEvent) {
    if (this.state.selectionImage !== undefined) {
      if (this.isPointInSelection(event.point)) {
        if (!this.state.moveSelectionTool) {
          this.patchState(new MoveSelectionTool(this.executeAction.bind(this)), 'moveSelectionTool');
        }
        this.state.moveSelectionTool.mouseDown(this.state.selectionOffset, event);
      } else {
        const action: DeselectSelectionAction = new DeselectSelectionAction();
        this.executeAction(action);
        this.state.selectedDrawingTool?.mouseDown(event);
      }
    } else {
      this.state.selectedDrawingTool?.mouseDown(event);
    }
  }

  processMouseUp(event: TspMouseEvent) {
    if (this.state.moveSelectionTool !== undefined) {
      this.state.moveSelectionTool.mouseUp(event);
    } else {
      this.state.selectedDrawingTool?.mouseUp(event);
    }
  }

  processMouseMove(event: TspMouseEvent) {
    this.patchState(event.point, 'mousePosition');
    if (this.state.moveSelectionTool !== undefined) {
      this.state.moveSelectionTool.mouseMove(event);
    } else {
      this.state.selectedDrawingTool?.mouseMove(event);
    }
  }

  private isPointInSelection(point: Point): boolean {
    const selectionRectangleWith3pxBorder: RectangleArea = {
      start: {
        w: this.state.selectionOffset.w - 3,
        h: this.state.selectionOffset.h - 3,
      },
      end: {
        w: this.state.selectionOffset.w + this.state.selectionImage.width - 1 + 3,
        h: this.state.selectionOffset.h + this.state.selectionImage.height - 1 + 3,
      },
    };

    return isPointInRectangle(point, selectionRectangleWith3pxBorder);
  }

  ////////////////////////////// File operations //////////////////////////////

  loadFile(file: File) {
    readImageDataFromFile(file).then((imageData) => {
      const fileData: ImageFileData = { imageData, fileName: getFileNameWithoutExtension(file.name) };
      const action: OpenFileAction = new OpenFileAction(fileData);
      this.executeAction(action);
    });
  }

  loadFileFromUrl(imageUrl: string) {
    const splitUrl: string[] = imageUrl.split('/');
    const fileName: string = getFileNameWithoutExtension(splitUrl[splitUrl.length - 1]);
    readImageDataFromUrl(imageUrl).then((imageData) => {
      const fileData: ImageFileData = { imageData, fileName };
      const action: OpenFileAction = new OpenFileAction(fileData);
      this.executeAction(action);
    });
  }

  pasteFile(pastedFile: File) {
    if (pastedFile !== null) {
      readImageDataFromFile(pastedFile).then((pastedImage) => {
        this.clearPreview();
        this.setDrawingTool(DrawingToolType.rectangleSelect);
        const action: PasteImageAction = new PasteImageAction(
          pastedImage,
          unzoomPoint(this.state.scrollPosition, this.state.zoom)
        );
        this.executeAction(action);
      });
    }
  }

  ////////////////////////////// UI changes //////////////////////////////

  setDrawingTool(toolType: DrawingToolType) {
    const action: SetDrawingToolAction = new SetDrawingToolAction(toolType, this.getDrawingTool.bind(this));
    this.executeAction(action);
  }

  private getDrawingTool(toolType: DrawingToolType): DrawingTool {
    return new DrawingTool(toolType, this.executeAction.bind(this), this.clearPreview.bind(this));
  }

  private clearPreview() {
    this.patchState(new ImageData(1, 1), 'previewImage');
  }

  setDrawingToolOptions(changedOptions: Partial<DrawingToolOptions>) {
    const action: SetDrawingToolOptionsAction = new SetDrawingToolOptionsAction(changedOptions);
    this.executeAction(action);
  }

  setColor(selection: ColorSelection) {
    const action: SetColorAction = new SetColorAction(selection);
    this.executeAction(action);
  }

  setScrollPosition(scrollPosition: Point) {
    this.patchState(scrollPosition, 'scrollPosition');
  }

  setViewportSize(viewportSize: Point) {
    this.patchState(viewportSize, 'viewportSize');
  }

  ////////////////////////////// Menu actions //////////////////////////////

  executeMenuAction(menuAction: MenuActionType) {
    const menuActionFunction: () => void = this.getMenuActionFunction(menuAction);
    menuActionFunction();
  }

  private getMenuActionFunction(menuAction: MenuActionType): () => void {
    switch (menuAction) {
      case MenuActionType.NEW:
        return this.newFile.bind(this);
      case MenuActionType.OPEN_FILE:
        return this.openFile.bind(this);
      case MenuActionType.SAVE_FILE:
        return this.saveFile.bind(this);
      case MenuActionType.UNDO:
        return this.undo.bind(this);
      case MenuActionType.REPEAT:
        return this.repeat.bind(this);
      case MenuActionType.COPY:
        return this.copy.bind(this);
      case MenuActionType.CUT:
        return this.cut.bind(this);
      case MenuActionType.CLEAR_IMAGE:
        return this.clearImage.bind(this);
      case MenuActionType.CROP:
        return this.crop.bind(this);
      case MenuActionType.STRETCH_SKEW:
        return this.openStretchSkewWindow.bind(this);
      case MenuActionType.INVERT_COLORS:
        return this.invertColors.bind(this);
      case MenuActionType.FLIP_IMAGE:
        return this.openFlipRotateWindow.bind(this);
      case MenuActionType.OPEN_ATTRIBUTES_WINDOW:
        return this.openAttributesWindow.bind(this);
      case MenuActionType.SELECT_ALL:
        return this.selectAll.bind(this);
      case MenuActionType.CLEAR_SELECTION:
        return this.clearSelection.bind(this);
      case MenuActionType.DESELECT:
        return this.deselectIfSelected.bind(this);
      case MenuActionType.ABOUT_PAINT:
        return this.aboutPaint.bind(this);
    }

    assertUnreachable(menuAction);
  }

  private newFile() {
    location.reload();
  }

  private openFile() {
    showFileUploadDialog().then((selectedFile) => {
      const action: OpenFileAction = new OpenFileAction(selectedFile);
      this.executeAction(action);
    });
  }

  private saveFile() {
    this.deselectIfSelected();
    saveFile({ imageData: this.state.image, fileName: this.state.fileName });
    this.patchState(false, 'unsavedChanges');
  }

  private undo() {
    if (this.state.undoPointer >= 0) {
      const undoPointer: number = this.state.undoPointer;
      const actionToUndo: TsPaintAction = this.state.actions[undoPointer];
      actionToUndo.undoActions.forEach((undoAction) => {
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

  private copy() {
    if (this.state.selectionImage) {
      copyImagePart(this.state.selectionImage);
    }
  }

  private cut() {
    this.copy();
    this.clearSelection();
  }

  private clearImage() {
    const action: ClearImageAction = new ClearImageAction();
    this.executeAction(action);
  }

  private crop() {
    if (isDefined(this.state.selectionImage)) {
      const action: CropAction = new CropAction();
      this.executeAction(action);
    }
  }

  private invertColors() {
    const action: InvertColorsAction = new InvertColorsAction();
    this.executeAction(action);
  }

  private selectAll() {
    const action: RectangleSelectAction = new RectangleSelectAction(
      [
        { w: 0, h: 0 },
        { w: this.state.image.width - 1, h: this.state.image.height - 1 },
      ],
      false,
      'image'
    );
    this.executeAction(action);
  }

  private clearSelection() {
    const action: DeleteSelectionAction = new DeleteSelectionAction();
    this.executeAction(action);
  }

  private deselectIfSelected() {
    if (this.state.selectionImage !== undefined) {
      this.executeAction(new DeselectSelectionAction(), true);
    }
  }

  ////////////////////////////// Stretch/skew window //////////////////////////////

  private openStretchSkewWindow() {
    this.patchState(true, 'stretchSkewWindowOpen');
  }

  stretchSkew(params: StretchSkewParams) {
    this.closeStretchSkewWindow();

    let action: TsPaintAction;
    if (params.stretch) {
      action = new StretchImageAction(params.stretch);
    } else if (params.skew) {
      //TODO: action = new SkewImageAction(params.skew);
    }
    this.executeAction(action);
  }

  closeStretchSkewWindow() {
    this.patchState(false, 'stretchSkewWindowOpen');
  }

  ////////////////////////////// Flip/rotate window //////////////////////////////

  private openFlipRotateWindow() {
    this.patchState(true, 'flipRotateWindowOpen');
  }

  flipRotate(params: FlipRotateParams) {
    this.closeFlipRotateWindow();

    let action: TsPaintAction;
    if (params.flip) {
      action = new FlipImageAction(params.flip);
    } else if (params.rotate) {
      action = new RotateImageAction(params.rotate);
    }
    this.executeAction(action);
  }

  closeFlipRotateWindow() {
    this.patchState(false, 'flipRotateWindowOpen');
  }

  ////////////////////////////// Attributes window //////////////////////////////

  private openAttributesWindow() {
    this.patchState(true, 'attributesWindowOpen');
  }

  changeAttributes(dimensions: Point) {
    this.closeAttributesWindow();
    const action: ResizeImageAction = new ResizeImageAction(dimensions.w, dimensions.h);
    this.executeAction(action);
  }

  closeAttributesWindow() {
    this.patchState(false, 'attributesWindowOpen');
  }

  ////////////////////////////// About Paint window //////////////////////////////

  private aboutPaint() {
    this.patchState(true, 'aboutPaintWindowOpen');
  }

  closeAboutPaintWindow() {
    this.patchState(false, 'aboutPaintWindowOpen');
  }

  ////////////////////////////// Hotkey actions //////////////////////////////

  executeHotkeyAction(event: KeyboardEvent): boolean {
    const hotkeyActionFunction: () => void = this.getHotkeyActionFunction(event);

    if (hotkeyActionFunction) {
      hotkeyActionFunction();
      return true;
    } else {
      return false;
    }
  }

  private getHotkeyActionFunction(event: KeyboardEvent): () => void | undefined {
    const menuAction: MenuActionType = findMenuActionTypeByHotkeyEvent(
      [...this.state.menuStructure, ...this.state.hiddenHotkeyShortcuts],
      event
    );
    if (menuAction) {
      return this.getMenuActionFunction(menuAction);
    }
  }

  ////////////////////////////// Action processing //////////////////////////////

  private executeAction(action: TsPaintAction, logToHistory: boolean = true) {
    if (logToHistory && action.deselectsSelection) {
      this.deselectIfSelected();
    }
    if (action.replacesImage && this.state.unsavedChanges && this.userWantsToSaveImage()) {
      this.saveFile();
    }

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(this.state, logToHistory);

    this.setState({ ...this.state, ...patches });
  }

  private userWantsToSaveImage(): boolean {
    return confirm('Save changes to ' + this.state.fileName + '?');
  }
}
