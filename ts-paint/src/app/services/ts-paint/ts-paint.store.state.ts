import { MenuAction } from 'src/app/types/menu/menu-action';
import { MenuItem } from 'src/app/types/menu/menu-item';
import { createImage } from 'src/app/helpers/image.helpers';
import { DrawingTool } from 'src/app/types/drawing-tools/drawing-tool';
import { DrawingToolBehaviour } from 'src/app/types/drawing-tools/drawing-tool-behaviour';
import { Color } from 'src/app/types/base/color';
import { DrawingToolAction } from 'src/app/types/drawing-tools/drawing-tool-action';

export class TsPaintStoreState {
  zoom: number = 1;
  image: ImageData = createImage(300, 200);
  previewImage: ImageData = createImage(300, 200, { r: 0, g: 0, b: 0, a: 0 });
  fileName: string;
  primaryColor: Color = { r: 0, g: 0, b: 0 };
  secondaryColor: Color = { r: 255, g: 255, b: 255 };
  previewAction: DrawingToolAction;
  actions: DrawingToolAction[] = [];
  selectedDrawingTool: DrawingTool;
  /*drawingTools: DrawingTool[] = [
    {
      name: 'freeFormSelect',
      behaviour: DrawingToolBehaviour.FREE_DRAW
    },
    {
      name: 'rectangleSelect',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2
    },
    {
      name: 'eraser',
      behaviour: DrawingToolBehaviour.FREE_DRAW
    },
    {
      name: 'colorFiller',
      behaviour: DrawingToolBehaviour.SINGLE_POINT
    },
    {
      name: 'colorPicker',
      behaviour: DrawingToolBehaviour.SINGLE_POINT
    },
    {
      name: 'magnifier',
      behaviour: DrawingToolBehaviour.SINGLE_POINT
    },
    {
      name: 'pencil',
      behaviour: DrawingToolBehaviour.FREE_DRAW
    },
    {
      name: 'brush',
      behaviour: DrawingToolBehaviour.FREE_DRAW
    },
    {
      name: 'airbrush',
      behaviour: DrawingToolBehaviour.FREE_DRAW
    },
    {
      name: 'text',
      behaviour: DrawingToolBehaviour.TEXT
    },
    {
      name: 'line',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2
    },
    {
      name: 'curve',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 4
    },
    {
      name: 'rectangle',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2
    },
    {
      name: 'polygon',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
    },
    {
      name: 'ellipse',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2
    },
    {
      name: 'roundedRectangle',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2
    },
    {
      name: 'moveSelection',
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2,
      hidden: true
    },
  ];*/
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
          action: MenuAction.OPEN_FILE
        },
        {
          name: 'Save',
          hotkeys: 'Ctrl+S',
          action: MenuAction.SAVE_FILE
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
          action: MenuAction.UNDO
        },
        {
          name: 'Repeat',
          action: MenuAction.REPEAT
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
          action: MenuAction.CLEAR_IMAGE
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