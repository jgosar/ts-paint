import { MenuActionType } from '../../types/menu/menu-action-type';
import { MenuItem } from '../../types/menu/menu-item';
import { createImage } from '../../helpers/image.helpers';
import { DrawingTool } from '../../types/drawing-tools/drawing-tool';
import { Color } from '../../types/base/color';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { TsPaintAction } from '../../types/actions/ts-paint-action';
import { Point } from '../../types/base/point';
import { MoveSelectionTool } from '../../types/drawing-tools/move-selection-tool';

export class TsPaintStoreState {
  zoom: number = 1;
  image: ImageData = createImage(300, 200);
  previewImage: ImageData;
  previewOffset: Point = { w: 0, h: 0 };
  selectionImage: ImageData;
  selectionOffset: Point = { w: 0, h: 0 };
  moveSelectionTool: MoveSelectionTool;
  fileName: string = 'untitled';
  primaryColor: Color = { r: 0, g: 0, b: 0 };
  secondaryColor: Color = { r: 255, g: 255, b: 255 };
  availableColors: Color[] = [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, { r: 128, g: 128, b: 128 }, { r: 196, g: 196, b: 196 }, { r: 128, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 128, g: 128, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 255 }, { r: 0, g: 0, b: 128 }, { r: 0, g: 0, b: 255 }, { r: 128, g: 0, b: 128 }, { r: 255, g: 0, b: 255 }];
  previewAction: TsPaintAction;
  actions: TsPaintAction[] = [];
  selectedDrawingTool: DrawingTool;
  availableDrawingTools: DrawingToolType[] = [
    DrawingToolType.rectangleSelect, DrawingToolType.colorFiller, DrawingToolType.colorPicker, DrawingToolType.magnifier, DrawingToolType.pencil, DrawingToolType.line, DrawingToolType.rectangle, DrawingToolType.ellipse
  ];
  undoPointer: number = -1;
  attributesWindowOpen: boolean = false;
  mousePosition: Point;
  menuStructure: MenuItem[] = [
    {
      name: 'File',
      menus: [
        {
          name: 'New',
          disabled: true
        },
        {
          name: 'Open...',
          hotkeys: ['Ctrl', 'O'],
          action: MenuActionType.OPEN_FILE
        },
        {
          name: 'Save',
          hotkeys: ['Ctrl', 'S'],
          action: MenuActionType.SAVE_FILE
        },
        {
          name: 'Save As...',
          disabled: true
        },
        {},
        {
          name: 'Print Preview',
          disabled: true
        },
        {
          name: 'Page Setup...',
          disabled: true
        },
        {
          name: 'Print...',
          disabled: true
        },
        {},
        {
          name: 'Set As Wallpaper (Tiled)',
          disabled: true
        },
        {
          name: 'Set As Wallpaper (Centered)',
          disabled: true
        },
        {},
        {
          name: 'Recent file',
          disabled: true
        },
        {},
        {
          name: 'Exit',
          disabled: true
        },
      ]
    },
    {
      name: 'Edit',
      menus: [
        {
          name: 'Undo',
          hotkeys: ['Ctrl', 'Z'],
          action: MenuActionType.UNDO
        },
        {
          name: 'Repeat',
          hotkeys: ['Ctrl', 'Y'],
          action: MenuActionType.REPEAT
        },
        {},
        {
          name: 'Cut',
          disabled: true
        },
        {
          name: 'Copy',
          hotkeys: ['Ctrl', 'C'],
          action: MenuActionType.COPY
        },
        {
          name: 'Paste',
          disabled: true
        },
        {
          name: 'Clear Selection',
          hotkeys: ['Delete'],
          action: MenuActionType.CLEAR_SELECTION
        },
        {
          name: 'Select All',
          hotkeys: ['Ctrl', 'A'],
          action: MenuActionType.SELECT_ALL
        },
        {},
        {
          name: 'Copy To',
          disabled: true
        },
        {
          name: 'Paste From...',
          disabled: true
        },
      ]
    },
    {
      name: 'View',
      menus: [
        {
          name: 'Tool Box',
          disabled: true
        },
        {
          name: 'Color Box',
          disabled: true
        },
        {
          name: 'Status Bar',
          disabled: true
        },
        {},
        {
          name: 'Zoom',
          disabled: true,
          menus: [
            {
              name: 'Normal Size',
              disabled: true
            },
            {
              name: 'Large Size',
              disabled: true
            },
            {
              name: 'Custom...',
              disabled: true
            },
            {},
            {
              name: 'Show Grid',
              disabled: true
            },
            {
              name: 'Show Thumbnail',
              disabled: true
            },
          ]
        },
        {
          name: 'View Bitmap',
          disabled: true
        },
        {
          name: 'Text Toolbar',
          disabled: true
        },
      ]
    },
    {
      name: 'Image',
      menus: [
        {
          name: 'Flip/Rotate',
          disabled: true
        },
        {
          name: 'Stretch/Skew',
          disabled: true
        },
        {
          name: 'Invert Colors',
          disabled: true
        },
        {
          name: 'Attributes',
          action: MenuActionType.OPEN_ATTRIBUTES_WINDOW
        },
        {
          name: 'Clear Image',
          action: MenuActionType.CLEAR_IMAGE
        },
      ]
    },
    {
      name: 'Options',
      menus: [
        {
          name: 'Edit Colors',
          disabled: true
        },
        {
          name: 'Get Colors',
          disabled: true
        },
        {
          name: 'Save Colors',
          disabled: true
        },
        {
          name: 'Draw Opaque',
          disabled: true
        },
      ]
    },
    {
      name: 'Help',
      menus: [
        {
          name: 'Help Topics',
          disabled: true
        },
        {},
        {
          name: 'About Paint',
          disabled: true
        }
      ]
    }
  ];
  hiddenHotkeyShortcuts: MenuItem[] = [
    {
      name: 'Deselect',
      hotkeys: ['Escape'],
      action: MenuActionType.DESELECT
    }
  ];
}