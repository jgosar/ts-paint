import { MenuItem } from '../../types/menu/menu-item';
import { createImage } from '../../helpers/image.helpers';
import { DrawingTool } from '../../types/drawing-tools/drawing-tool';
import { Color } from '../../types/base/color';
import { TsPaintAction } from '../../types/actions/ts-paint-action';
import { Point } from '../../types/base/point';
import { MoveSelectionTool } from '../../types/drawing-tools/move-selection-tool';
import {
  DEFAULT_AVAILABLE_COLORS,
  MENU_STRUCTURE,
  NON_MENU_SHORTCUTS,
  COLOR_WHITE,
  DEFAULT_DRAWING_TOOL_OPTIONS,
} from './ts-paint.config';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';

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
  mousePosition: Point;
  unsavedChanges: boolean = false;
  menuStructure: MenuItem[] = MENU_STRUCTURE;
  hiddenHotkeyShortcuts: MenuItem[] = NON_MENU_SHORTCUTS;
}
