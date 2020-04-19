import { MenuActionType } from 'src/app/types/menu/menu-action-type';
import { MenuItem } from 'src/app/types/menu/menu-item';
import { createImage } from 'src/app/helpers/image.helpers';
import { DrawingTool } from 'src/app/types/drawing-tools/drawing-tool';
import { Color } from 'src/app/types/base/color';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { TsPaintAction } from 'src/app/types/actions/ts-paint-action';
import { Point } from 'src/app/types/base/point';
import { MoveSelectionTool } from 'src/app/types/drawing-tools/move-selection-tool';

export class TsPaintStoreState {
  zoom: number = 1;
  image: ImageData = createImage(300, 200);
  previewImage: ImageData;
  previewOffset: Point = { w: 0, h: 0 };
  selectionImage: ImageData;
  selectionOffset: Point = { w: 0, h: 0 };
  moveSelectionTool: MoveSelectionTool;
  fileName: string;
  primaryColor: Color = { r: 0, g: 0, b: 0 };
  secondaryColor: Color = { r: 255, g: 255, b: 255 };
  availableColors: Color[] = [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, { r: 128, g: 128, b: 128 }, { r: 196, g: 196, b: 196 }, { r: 128, g: 0, b: 0 }, { r: 255, g: 0, b: 0 }, { r: 128, g: 128, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 128, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 128, b: 128 }, { r: 0, g: 255, b: 255 }, { r: 0, g: 0, b: 128 }, { r: 0, g: 0, b: 255 }, { r: 128, g: 0, b: 128 }, { r: 255, g: 0, b: 255 }];
  previewAction: TsPaintAction;
  actions: TsPaintAction[] = [];
  selectedDrawingTool: DrawingTool;
  availableDrawingTools: DrawingToolType[] = [
    DrawingToolType.pencil, DrawingToolType.line
  ];
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
          hotkeys: 'Ctrl+O',
          action: MenuActionType.OPEN_FILE
        },
        {
          name: 'Save',
          hotkeys: 'Ctrl+S',
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
          action: MenuActionType.UNDO
        },
        {
          name: 'Repeat',
          action: MenuActionType.REPEAT
        },
        {},
        {
          name: 'Cut',
          disabled: true
        },
        {
          name: 'Copy',
          disabled: true
        },
        {
          name: 'Paste',
          disabled: true
        },
        {
          name: 'Clear Selection',
          disabled: true
        },
        {
          name: 'Select All',
          disabled: true
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
          disabled: true
        },
        {
          name: 'Clear Image',
          hotkeys: 'Ctrl+Shft+N',
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
}