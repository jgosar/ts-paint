import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from './store';
import { MenuActionType } from '../../types/menu/menu-action-type';
import { assertUnreachable, isDefined } from '../../helpers/typescript.helpers';
import { reloadPage } from '../../helpers/environment.helpers';
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
  downloadFile,
  isAbortError,
  isFileSystemAccessSupported,
  showFileUploadDialog,
  showSaveFilePickerForImage,
  readImageDataFromFile,
  getFileNameWithoutExtension,
  getImageFileFormat,
  isWritableImageFileName,
  readImageDataFromUrl,
  writeImageToFileHandle,
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
import { TspPinchEvent } from 'src/app/types/mouse-tracker/tsp-pinch-event';
import { getScrollPositionAnchoredOn } from 'src/app/helpers/zoom.helpers';
import { isGridAvailable } from 'src/app/helpers/grid.helpers';
import { CropAction } from 'src/app/types/actions/crop-action';
import { StretchSkewParams } from 'src/app/types/action-params/stretch-skew-params';
import { StretchImageAction } from 'src/app/types/actions/stretch-image-action';
import { ImageFileData } from 'src/app/types/base/image-file-data';
import { ImageFileFormat } from 'src/app/types/base/image-file-format';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { SetDrawingToolOptionsAction } from 'src/app/types/actions/set-drawing-tool-options-action';
import { Color } from 'src/app/types/base/color';
import { getMenuStructure, MenuFlags } from './ts-paint.config';
import { TextOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { TextBox } from 'src/app/types/base/text-box';
import { areaSize } from 'src/app/helpers/area.helpers';
import { fitTextBox, GENERIC_FONT_FAMILIES, renderTextBox } from 'src/app/helpers/text.helpers';
import {
  detectAvailableFonts,
  getPreferredFont,
  isLocalFontAccessGranted,
  isLocalFontAccessSupported,
  queryLocalFontFamilies,
} from 'src/app/helpers/font.helpers';
import { DrawTextAction } from 'src/app/types/actions/draw-text-action';

function getMenuFlags(state: TsPaintStoreState): MenuFlags {
  return {
    drawOpaque: state.drawingToolOptions[DrawingToolType.rectangleSelect].drawOpaque,
    textBoxOpen: state.textBox !== undefined,
    textToolbarVisible: state.textToolbarVisible,
    gridAvailable: isGridAvailable(state.zoom),
    showGrid: state.showGrid,
  };
}

/** Menu actions that leave an open text box open; every other one first pastes its text into the image */
const MENU_ACTIONS_KEEPING_THE_TEXT_BOX: MenuActionType[] = [
  MenuActionType.TOGGLE_DRAW_OPAQUE,
  MenuActionType.TOGGLE_TEXT_TOOLBAR,
  MenuActionType.TOGGLE_SHOW_GRID,
];

function menuFlagsEqual(a: MenuFlags, b: MenuFlags): boolean {
  return (Object.keys(a) as (keyof MenuFlags)[]).every((key) => a[key] === b[key]);
}

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState> {
  constructor() {
    super(new TsPaintStoreState());
  }

  /** Keeps the menu's check marks and enabled states in line with the state, whichever way the state changed
   * (including undo and repeat). The menu is only rebuilt when one of its flags changes. */
  setState(nextState: TsPaintStoreState): void {
    const flags: MenuFlags = getMenuFlags(nextState);
    if (!menuFlagsEqual(flags, getMenuFlags(this.state))) {
      nextState = { ...nextState, menuStructure: getMenuStructure(flags) };
    }
    super.setState(nextState);
  }

  /** The color that is see-through in a selection, or undefined while Draw Opaque is on */
  get selectionTransparentColor(): Color | undefined {
    return this.state.drawingToolOptions[DrawingToolType.rectangleSelect].drawOpaque
      ? undefined
      : this.state.secondaryColor;
  }

  ////////////////////////////// Mouse actions //////////////////////////////

  /** Set by a mouse down that only closed the text box: the rest of that click or drag does nothing */
  private _ignoreMouseUntilUp: boolean = false;

  processMouseDown(event: TspMouseEvent) {
    if (this.state.textBox !== undefined) {
      // Like MS Paint, a click outside the text box pastes the text and does nothing else
      this.commitTextBox();
      this._ignoreMouseUntilUp = true;
    } else if (this.state.selectionImage !== undefined) {
      if (this.isPointInSelection(event.point)) {
        if (!this.state.moveSelectionTool) {
          this.patchState(new MoveSelectionTool(this.executeAction.bind(this)), 'moveSelectionTool');
        }
        this.state.moveSelectionTool.mouseDown(this.state.selectionOffset, event);
      } else {
        const action: DeselectSelectionAction = new DeselectSelectionAction(this.selectionTransparentColor);
        this.executeAction(action);
        this.state.selectedDrawingTool?.mouseDown(event);
      }
    } else {
      this.state.selectedDrawingTool?.mouseDown(event);
    }
  }

  processMouseUp(event: TspMouseEvent) {
    if (this._ignoreMouseUntilUp) {
      this._ignoreMouseUntilUp = false;
    } else if (this.state.moveSelectionTool !== undefined) {
      this.state.moveSelectionTool.mouseUp(event);
    } else {
      this.state.selectedDrawingTool?.mouseUp(event);
      if (this.state.textBox !== undefined) {
        this.detectFontsOnce();
      }
    }
  }

  processMouseMove(event: TspMouseEvent) {
    this.patchState(event.point, 'mousePosition');
    if (this._ignoreMouseUntilUp) {
      return;
    }
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

  async loadFile(file: File, fileHandle: Promise<FileSystemHandle | null> = Promise.resolve(null)): Promise<void> {
    await this.confirmSaveBeforeReplacingImage();
    const imageData: ImageData = await readImageDataFromFile(file);
    const handle: FileSystemHandle | null = await fileHandle;
    const fileData: ImageFileData = {
      imageData,
      fileName: getFileNameWithoutExtension(file.name),
      fileFormat: getImageFileFormat(file.name, file.type),
      fileHandle:
        handle?.kind === 'file' && isWritableImageFileName(file.name) ? (handle as FileSystemFileHandle) : undefined,
    };
    this.executeAction(new OpenFileAction(fileData));
  }

  async loadFileFromUrl(imageUrl: string): Promise<void> {
    await this.confirmSaveBeforeReplacingImage();
    const splitUrl: string[] = imageUrl.split('/');
    const fileName: string = getFileNameWithoutExtension(splitUrl[splitUrl.length - 1]);
    const fileFormat: ImageFileFormat = getImageFileFormat(splitUrl[splitUrl.length - 1]);
    const imageData: ImageData = await readImageDataFromUrl(imageUrl);
    const fileData: ImageFileData = { imageData, fileName, fileFormat };
    this.executeAction(new OpenFileAction(fileData));
  }

  private async confirmSaveBeforeReplacingImage(): Promise<void> {
    if (this.state.unsavedChanges && this.userWantsToSaveImage()) {
      await this.saveFile();
    }
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
    this.refitTextBox(this.state.textBox);
  }

  ////////////////////////////// Text tool //////////////////////////////

  setTextOptions(changes: Partial<TextOptions>) {
    const options: TextOptions = this.state.drawingToolOptions[DrawingToolType.text];
    this.setDrawingToolOptions({ [DrawingToolType.text]: { ...options, ...changes } });
  }

  setTextBoxText(text: string) {
    if (this.state.textBox !== undefined) {
      this.refitTextBox({ ...this.state.textBox, text });
    }
  }

  /** Moves or resizes the text box */
  setTextBoxArea(area: RectangleArea) {
    if (this.state.textBox !== undefined) {
      this.refitTextBox({ ...this.state.textBox, area });
    }
  }

  /** Closes the text box without pasting its text */
  cancelTextBox() {
    this.patchState(undefined, 'textBox');
  }

  setTextToolbarPosition(position: Point) {
    this.patchState(position, 'textToolbarPosition');
  }

  /** The close button of the Fonts window, which unchecks View > Text Toolbar */
  hideTextToolbar() {
    this.patchState(false, 'textToolbarVisible');
  }

  get textOptions(): TextOptions {
    return this.state.drawingToolOptions[DrawingToolType.text];
  }

  /** True while the browser can list every installed font and has not done so yet */
  get canLoadMoreFonts(): boolean {
    return isLocalFontAccessSupported() && !this.state.allFontsLoaded;
  }

  /** Lists every installed font. The browser asks the user for permission the first time; if it is refused, the
   * list stays as it was. */
  async loadAllFonts(): Promise<void> {
    try {
      const fonts: string[] = await queryLocalFontFamilies();
      this.setState({ ...this.state, availableFonts: fonts, allFontsLoaded: true });
    } catch {
      // Refused or not supported: keep the fonts found so far
    }
  }

  /** Pastes the text of the open text box into the image (one undo step) and closes the box */
  private commitTextBox() {
    const textBox: TextBox = this.state.textBox;
    if (textBox === undefined) {
      return;
    }
    if (textBox.text === '') {
      this.cancelTextBox();
      return;
    }
    const size: Point = areaSize(textBox.area);
    const textImage: ImageData = renderTextBox({
      text: textBox.text,
      width: size.w,
      height: size.h,
      options: this.state.drawingToolOptions[DrawingToolType.text],
      textColor: this.state.primaryColor,
      backgroundColor: this.textBackgroundColor,
    });
    this.executeAction(new DrawTextAction(textImage, textBox.area.start));
  }

  /** The color behind the text, or undefined while Draw Opaque is off */
  get textBackgroundColor(): Color | undefined {
    return this.state.drawingToolOptions[DrawingToolType.rectangleSelect].drawOpaque
      ? this.state.secondaryColor
      : undefined;
  }

  private refitTextBox(textBox: TextBox | undefined) {
    if (textBox !== undefined) {
      const imageSize: Point = { w: this.state.image.width, h: this.state.image.height };
      this.patchState(fitTextBox(textBox, this.state.drawingToolOptions[DrawingToolType.text], imageSize), 'textBox');
    }
  }

  /** Finds the installed fonts when the first text box opens, and lists all of them if the user has allowed that */
  private detectFontsOnce() {
    if (this.state.availableFonts.length > 0) {
      return;
    }
    const fonts: string[] = detectAvailableFonts();
    const options: TextOptions = this.state.drawingToolOptions[DrawingToolType.text];
    const isAvailable: boolean =
      fonts.includes(options.fontFamily) || GENERIC_FONT_FAMILIES.includes(options.fontFamily);
    const fontFamily: string = isAvailable ? options.fontFamily : getPreferredFont(fonts);
    this.setState({
      ...this.state,
      availableFonts: fonts,
      drawingToolOptions: { ...this.state.drawingToolOptions, [DrawingToolType.text]: { ...options, fontFamily } },
    });
    this.refitTextBox(this.state.textBox);
    isLocalFontAccessGranted().then((granted) => {
      if (granted) {
        this.loadAllFonts();
      }
    });
  }

  private toggleTextToolbar() {
    this.patchState(!this.state.textToolbarVisible, 'textToolbarVisible');
  }

  /** Before a menu action or shortcut: Escape throws the text away, most other actions paste it first */
  private prepareTextBoxForMenuAction(menuAction: MenuActionType) {
    if (this.state.textBox === undefined || MENU_ACTIONS_KEEPING_THE_TEXT_BOX.includes(menuAction)) {
      return;
    }
    if (menuAction === MenuActionType.DESELECT) {
      this.cancelTextBox();
    } else {
      this.commitTextBox();
    }
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

  /**
   * Two fingers keep the image point they landed on under their midpoint while they pan and zoom by 2x steps.
   * Unlike the magnifier it is not a part of the history.
   */
  pinchZoom(event: TspPinchEvent) {
    const zoom: number = event.zoomIn === undefined ? this.state.zoom : this.state.zoom * (event.zoomIn ? 2 : 0.5);
    const scrollPosition: Point = getScrollPositionAnchoredOn(
      this.state.scrollPosition,
      this.state.zoom,
      zoom,
      event.anchor,
      event.centre
    );
    this.setState({ ...this.state, zoom, scrollPosition });
  }

  ////////////////////////////// Grid //////////////////////////////

  /** The grid shows while it is switched on and the zoom is high enough for it */
  get gridVisible(): boolean {
    return this.state.showGrid && isGridAvailable(this.state.zoom);
  }

  /** Ctrl+G gets here at any zoom, also while the menu item is disabled */
  private toggleShowGrid() {
    if (isGridAvailable(this.state.zoom)) {
      this.patchState(!this.state.showGrid, 'showGrid');
    }
  }

  ////////////////////////////// Menu actions //////////////////////////////

  executeMenuAction(menuAction: MenuActionType) {
    if (!isDefined(menuAction)) {
      return;
    }
    this.prepareTextBoxForMenuAction(menuAction);
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
      case MenuActionType.SAVE_AS:
        return this.saveFileAs.bind(this);
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
      case MenuActionType.TOGGLE_DRAW_OPAQUE:
        return this.toggleDrawOpaque.bind(this);
      case MenuActionType.TOGGLE_TEXT_TOOLBAR:
        return this.toggleTextToolbar.bind(this);
      case MenuActionType.TOGGLE_SHOW_GRID:
        return this.toggleShowGrid.bind(this);
    }

    assertUnreachable(menuAction);
  }

  private newFile() {
    reloadPage();
  }

  private async openFile(): Promise<void> {
    await this.confirmSaveBeforeReplacingImage();
    try {
      const selectedFile: ImageFileData = await showFileUploadDialog();
      this.executeAction(new OpenFileAction(selectedFile));
    } catch (error) {
      if (!isAbortError(error)) {
        throw error;
      }
    }
  }

  private async saveFile(): Promise<void> {
    this.deselectIfSelected();
    if (!isFileSystemAccessSupported()) {
      this.downloadCurrentImage();
      return;
    }
    if (this.state.fileHandle) {
      await this.writeToHandle(this.state.fileHandle);
    } else {
      await this.saveFileAs();
    }
  }

  private async saveFileAs(): Promise<void> {
    if (!isFileSystemAccessSupported()) {
      this.openSaveAsWindow();
      return;
    }
    this.deselectIfSelected();
    let fileHandle: FileSystemFileHandle;
    try {
      fileHandle = await showSaveFilePickerForImage(this.state.fileName, this.state.fileFormat);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      throw error;
    }
    this.patchState(getFileNameWithoutExtension(fileHandle.name), 'fileName');
    this.patchState(getImageFileFormat(fileHandle.name), 'fileFormat');
    this.patchState(fileHandle, 'fileHandle');
    await this.writeToHandle(fileHandle);
  }

  private async writeToHandle(fileHandle: FileSystemFileHandle): Promise<void> {
    const imageData: ImageData = this.state.image;
    const fileName: string = this.state.fileName;
    const fileFormat: ImageFileFormat = this.state.fileFormat;
    try {
      await writeImageToFileHandle(fileHandle, imageData, fileFormat);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      // Permission denied or write failed: fall back to a download so the work is not lost.
      downloadFile({ imageData, fileName, fileFormat });
    }
    this.patchState(false, 'unsavedChanges');
  }

  private downloadCurrentImage() {
    downloadFile({ imageData: this.state.image, fileName: this.state.fileName, fileFormat: this.state.fileFormat });
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
      this.executeAction(new DeselectSelectionAction(this.selectionTransparentColor), true);
    }
  }

  private toggleDrawOpaque() {
    const drawOpaque: boolean = this.state.drawingToolOptions[DrawingToolType.rectangleSelect].drawOpaque;
    this.setDrawingToolOptions({ [DrawingToolType.rectangleSelect]: { drawOpaque: !drawOpaque } });
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
    if (isDefined(action)) {
      this.executeAction(action);
    }
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
    if (isDefined(action)) {
      this.executeAction(action);
    }
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

  ////////////////////////////// Save As window //////////////////////////////

  private openSaveAsWindow() {
    this.patchState(true, 'saveAsWindowOpen');
  }

  saveFileFromSaveAsWindow(params: { fileName: string; format: ImageFileFormat }) {
    this.closeSaveAsWindow();
    this.deselectIfSelected();
    this.patchState(params.fileName, 'fileName');
    this.patchState(params.format, 'fileFormat');
    this.patchState(undefined, 'fileHandle');
    this.downloadCurrentImage();
  }

  closeSaveAsWindow() {
    this.patchState(false, 'saveAsWindowOpen');
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
    const menuAction: MenuActionType = findMenuActionTypeByHotkeyEvent(
      [...this.state.menuStructure, ...this.state.hiddenHotkeyShortcuts],
      event
    );
    if (!menuAction) {
      return false;
    }
    this.prepareTextBoxForMenuAction(menuAction);
    this.getMenuActionFunction(menuAction)();
    return true;
  }

  ////////////////////////////// Action processing //////////////////////////////

  private executeAction(action: TsPaintAction, logToHistory: boolean = true) {
    if (logToHistory && action.deselectsSelection) {
      this.commitTextBox();
      this.deselectIfSelected();
    }
    const patches: Partial<TsPaintStoreState> = action.getStatePatches(this.state, logToHistory);

    this.setState({ ...this.state, ...patches });
  }

  private userWantsToSaveImage(): boolean {
    return confirm('Save changes to ' + this.state.fileName + '?');
  }
}
