import { MenuItem } from '../../types/menu/menu-item';
import { createImage } from '../../helpers/image.helpers';
import { DrawingTool } from '../../types/drawing-tools/drawing-tool';
import { Color } from '../../types/base/color';
import { TsPaintAction } from '../../types/actions/ts-paint-action';
import { Point } from '../../types/base/point';
import { MoveSelectionTool } from '../../types/drawing-tools/move-selection-tool';
import {
  DEFAULT_AVAILABLE_COLORS,
  NON_MENU_SHORTCUTS,
  COLOR_WHITE,
  DEFAULT_DRAWING_TOOL_OPTIONS,
  getMenuStructure,
} from './ts-paint.config';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { TextBox } from 'src/app/types/base/text-box';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { DEFAULT_IMAGE_FILE_FORMAT, ImageFileFormat } from 'src/app/types/base/image-file-format';

export class TsPaintStoreState {
  zoom: number = 1;
  image: ImageData = createImage(300, 200);
  scrollPosition: Point = { w: 0, h: 0 };
  viewportSize: Point = { w: 600, h: 400 };
  previewImage: ImageData;
  previewOffset: Point = { w: 0, h: 0 };
  selectionImage: ImageData;
  selectionOffset: Point = { w: 0, h: 0 };
  moveSelectionTool: MoveSelectionTool;
  fileName: string = 'untitled';
  fileFormat: ImageFileFormat = DEFAULT_IMAGE_FILE_FORMAT;
  fileHandle: FileSystemFileHandle | undefined = undefined;
  primaryColor: Color = { r: 0, g: 0, b: 0 };
  secondaryColor: Color = COLOR_WHITE;
  availableColors: Color[] = DEFAULT_AVAILABLE_COLORS;
  previewAction: TsPaintAction;
  actions: TsPaintAction[] = [];
  selectedDrawingTool: DrawingTool;
  drawingToolOptions: DrawingToolOptions = DEFAULT_DRAWING_TOOL_OPTIONS;
  undoPointer: number = -1;
  attributesWindowOpen: boolean = false;
  flipRotateWindowOpen: boolean = false;
  aboutPaintWindowOpen: boolean = false;
  stretchSkewWindowOpen: boolean = false;
  saveAsWindowOpen: boolean = false;
  mousePosition: Point;
  unsavedChanges: boolean = false;
  /** The open text box of the text tool */
  textBox: TextBox | undefined = undefined;
  /** View > Text Toolbar: whether the Fonts window shows while a text box is open */
  textToolbarVisible: boolean = true;
  /** Where the Fonts window is, in css px from the top left of the page */
  textToolbarPosition: Point = { w: 88, h: 36 };
  /** View > Zoom > Show Grid: whether the pixel grid shows once the zoom is high enough for it */
  showGrid: boolean = false;
  /** The fonts the Fonts window offers; found when the first text box opens */
  availableFonts: string[] = [];
  /** True once every installed font is listed (Local Font Access) */
  allFontsLoaded: boolean = false;
  menuStructure: MenuItem[] = getMenuStructure({
    drawOpaque: DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.rectangleSelect].drawOpaque,
    textBoxOpen: false,
    textToolbarVisible: true,
    gridAvailable: false,
    showGrid: false,
  });
  hiddenHotkeyShortcuts: MenuItem[] = NON_MENU_SHORTCUTS;
}
