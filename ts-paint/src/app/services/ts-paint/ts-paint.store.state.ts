import { MenuAction } from 'src/app/types/menu/menu-action';
import { MenuItem } from 'src/app/types/menu/menu-item';
import { createImage } from 'src/app/helpers/image.helpers';
import { FileUploadComponent } from 'src/app/components/file-upload/file-upload.component';

export class TsPaintStoreState {
  zoom: number = 1;
  image: ImageData = createImage(300, 200);
  fileName: string;
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
  /*drawingTools = {
    rectangleSelect: () => new RectangleSelectTool(paintArea, saveChanges, clearChanges, getImageData, setSelection),
    colorFiller: () => new ColorFillerTool(paintArea, saveChanges, clearChanges, getImageData, batchPaintPixels),
    colorPicker: () => new ColorPickerTool(paintArea, saveChanges, clearChanges, getImageData, changeColor),
    line: () => new LineTool(paintArea, saveChanges, clearChanges),
    pencil: () => new PencilTool(paintArea, saveChanges, clearChanges),
    rectangle: () => new RectangleTool(paintArea, saveChanges, clearChanges)
  };*/
}