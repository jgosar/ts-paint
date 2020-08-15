import { Color } from 'src/app/types/base/color';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { MenuActionType } from 'src/app/types/menu/menu-action-type';
import { MenuItem } from 'src/app/types/menu/menu-item';

export const COLOR_WHITE: Color = { r: 255, g: 255, b: 255 };

export const DEFAULT_AVAILABLE_COLORS: Color[] = [
  { r: 0, g: 0, b: 0 },
  COLOR_WHITE,
  { r: 128, g: 128, b: 128 },
  { r: 196, g: 196, b: 196 },
  { r: 128, g: 0, b: 0 },
  { r: 255, g: 0, b: 0 },
  { r: 128, g: 128, b: 0 },
  { r: 255, g: 255, b: 0 },
  { r: 0, g: 128, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 0, g: 128, b: 128 },
  { r: 0, g: 255, b: 255 },
  { r: 0, g: 0, b: 128 },
  { r: 0, g: 0, b: 255 },
  { r: 128, g: 0, b: 128 },
  { r: 255, g: 0, b: 255 },
];

export const DRAWING_TOOLS: DrawingToolType[] = [
  DrawingToolType.rectangleSelect,
  DrawingToolType.colorFiller,
  DrawingToolType.colorPicker,
  DrawingToolType.magnifier,
  DrawingToolType.pencil,
  DrawingToolType.line,
  DrawingToolType.rectangle,
  DrawingToolType.ellipse,
];

export const MENU_STRUCTURE: MenuItem[] = [
  {
    name: 'File',
    menus: [
      {
        name: 'New',
        hotkeys: ['Ctrl', 'N'],
        action: MenuActionType.NEW,
      },
      {
        name: 'Open...',
        hotkeys: ['Ctrl', 'O'],
        action: MenuActionType.OPEN_FILE,
      },
      {
        name: 'Save',
        hotkeys: ['Ctrl', 'S'],
        action: MenuActionType.SAVE_FILE,
      },
      {
        name: 'Save As...',
        disabled: true,
      },
      {},
      {
        name: 'Print Preview',
        disabled: true,
      },
      {
        name: 'Page Setup...',
        disabled: true,
      },
      {
        name: 'Print...',
        disabled: true,
      },
      {},
      {
        name: 'Set As Wallpaper (Tiled)',
        disabled: true,
      },
      {
        name: 'Set As Wallpaper (Centered)',
        disabled: true,
      },
      {},
      {
        name: 'Recent file',
        disabled: true,
      },
      {},
      {
        name: 'Exit',
        disabled: true,
      },
    ],
  },
  {
    name: 'Edit',
    menus: [
      {
        name: 'Undo',
        hotkeys: ['Ctrl', 'Z'],
        action: MenuActionType.UNDO,
      },
      {
        name: 'Repeat',
        hotkeys: ['Ctrl', 'Y'],
        action: MenuActionType.REPEAT,
      },
      {},
      {
        name: 'Cut',
        hotkeys: ['Ctrl', 'X'],
        action: MenuActionType.CUT,
      },
      {
        name: 'Copy',
        hotkeys: ['Ctrl', 'C'],
        action: MenuActionType.COPY,
      },
      {
        name: 'Paste',
        hotkeys: ['Ctrl', 'V'],
        disabled: true,
      },
      {
        name: 'Clear Selection',
        hotkeys: ['Delete'],
        action: MenuActionType.CLEAR_SELECTION,
      },
      {
        name: 'Select All',
        hotkeys: ['Ctrl', 'A'],
        action: MenuActionType.SELECT_ALL,
      },
      {},
      {
        name: 'Copy To',
        disabled: true,
      },
      {
        name: 'Paste From...',
        disabled: true,
      },
    ],
  },
  {
    name: 'View',
    menus: [
      {
        name: 'Tool Box',
        disabled: true,
      },
      {
        name: 'Color Box',
        disabled: true,
      },
      {
        name: 'Status Bar',
        disabled: true,
      },
      {},
      {
        name: 'Zoom',
        disabled: true,
        menus: [
          {
            name: 'Normal Size',
            disabled: true,
          },
          {
            name: 'Large Size',
            disabled: true,
          },
          {
            name: 'Custom...',
            disabled: true,
          },
          {},
          {
            name: 'Show Grid',
            disabled: true,
          },
          {
            name: 'Show Thumbnail',
            disabled: true,
          },
        ],
      },
      {
        name: 'View Bitmap',
        disabled: true,
      },
      {
        name: 'Text Toolbar',
        disabled: true,
      },
    ],
  },
  {
    name: 'Image',
    menus: [
      {
        name: 'Flip/Rotate',
        hotkeys: ['Ctrl', 'R'],
        action: MenuActionType.FLIP_IMAGE,
      },
      {
        name: 'Stretch/Skew',
        disabled: true,
      },
      {
        name: 'Invert Colors',
        hotkeys: ['Ctrl', 'I'],
        action: MenuActionType.INVERT_COLORS,
      },
      {
        name: 'Attributes',
        action: MenuActionType.OPEN_ATTRIBUTES_WINDOW,
      },
      {
        name: 'Clear Image',
        action: MenuActionType.CLEAR_IMAGE,
      },
      {
        name: 'Crop',
        action: MenuActionType.CROP,
      },
    ],
  },
  {
    name: 'Options',
    menus: [
      {
        name: 'Edit Colors',
        disabled: true,
      },
      {
        name: 'Get Colors',
        disabled: true,
      },
      {
        name: 'Save Colors',
        disabled: true,
      },
      {
        name: 'Draw Opaque',
        disabled: true,
      },
    ],
  },
  {
    name: 'Help',
    menus: [
      {
        name: 'Help Topics',
        disabled: true,
      },
      {},
      {
        name: 'About Paint',
        action: MenuActionType.ABOUT_PAINT,
      },
    ],
  },
];

export const NON_MENU_SHORTCUTS: MenuItem[] = [
  {
    name: 'Deselect',
    hotkeys: ['Escape'],
    action: MenuActionType.DESELECT,
  },
];
