import {
  COLOR_WHITE,
  DEFAULT_AVAILABLE_COLORS,
  DEFAULT_DRAWING_TOOL_OPTIONS,
  MENU_STRUCTURE,
  NON_MENU_SHORTCUTS,
  getMenuStructure,
  MenuFlags,
} from './ts-paint.config';
import { MenuActionType } from '../../types/menu/menu-action-type';
import { MenuItem } from '../../types/menu/menu-item';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { FillType } from '../../types/drawing-tools/fill-type';
import { ALL_BRUSH_SHAPES, BrushForm, brushShapesEqual } from '../../types/drawing-tools/brush-shape';
import { Color } from '../../types/base/color';
import { isEmpty } from '../../helpers/typescript.helpers';

/** Every menu item at any depth, separators included */
function flattenMenu(menu: MenuItem[]): MenuItem[] {
  return menu.flatMap((item) => [item, ...flattenMenu(item.menus ?? [])]);
}

function isSeparator(item: MenuItem): boolean {
  return item.name === undefined;
}

describe('DEFAULT_AVAILABLE_COLORS', () => {
  it('has the 16 colors of the MS Paint palette', () => {
    expect(DEFAULT_AVAILABLE_COLORS.length).toBe(16);
  });

  it('starts with black and white', () => {
    expect(DEFAULT_AVAILABLE_COLORS[0]).toEqual({ r: 0, g: 0, b: 0 });
    expect(DEFAULT_AVAILABLE_COLORS[1]).toBe(COLOR_WHITE);
  });

  it('contains no duplicates', () => {
    const keys: string[] = DEFAULT_AVAILABLE_COLORS.map((color: Color) => `${color.r},${color.g},${color.b}`);
    expect(new Set(keys).size).toBe(16);
  });

  it('only has valid opaque channel values', () => {
    DEFAULT_AVAILABLE_COLORS.forEach((color: Color) => {
      [color.r, color.g, color.b].forEach((channel) => {
        expect(Number.isInteger(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      });
      expect(color.a).toBeUndefined();
    });
  });
});

describe('MENU_STRUCTURE', () => {
  it('has the 6 top level menus of MS Paint', () => {
    expect(MENU_STRUCTURE.map((menu) => menu.name)).toEqual(['File', 'Edit', 'View', 'Image', 'Options', 'Help']);
  });

  it('gives every enabled leaf item an action', () => {
    flattenMenu(MENU_STRUCTURE)
      .filter((item) => !isSeparator(item) && !item.disabled && isEmpty(item.menus))
      .forEach((item) => {
        expect(item.action, item.name).toBeDefined();
      });
  });

  it('gives no action to disabled items or submenu containers', () => {
    flattenMenu(MENU_STRUCTURE)
      .filter((item) => item.disabled || !isEmpty(item.menus))
      .forEach((item) => {
        expect(item.action, item.name).toBeUndefined();
      });
  });

  it('uses every hotkey combination at most once, also counting the non-menu shortcuts', () => {
    const hotkeys: string[] = flattenMenu([...MENU_STRUCTURE, ...NON_MENU_SHORTCUTS])
      .filter((item) => !isEmpty(item.hotkeys))
      .map((item) => [...item.hotkeys].sort().join('+'));

    expect(hotkeys.length).toBeGreaterThan(0);
    expect(new Set(hotkeys).size, hotkeys.join(', ')).toBe(hotkeys.length);
  });

  it('only uses known modifier names in hotkeys', () => {
    flattenMenu(MENU_STRUCTURE)
      .filter((item) => !isEmpty(item.hotkeys))
      .forEach((item) => {
        const modifiers: string[] = item.hotkeys.slice(0, -1);
        modifiers.forEach((modifier) => expect(['Ctrl', 'Alt', 'Shift'], item.name).toContain(modifier));
      });
  });

  it('gives every action to at most one item', () => {
    const actions: number[] = flattenMenu(MENU_STRUCTURE)
      .filter((item) => item.action !== undefined)
      .map((item) => item.action);
    expect(new Set(actions).size).toBe(actions.length);
  });
});

describe('getMenuStructure', () => {
  const FLAGS: MenuFlags = {
    drawOpaque: true,
    textBoxOpen: false,
    textToolbarVisible: true,
    gridAvailable: false,
    showGrid: false,
  };

  function item(menu: MenuItem[], name: string): MenuItem {
    return flattenMenu(menu).find((menuItem) => menuItem.name === name);
  }

  function drawOpaqueItem(menu: MenuItem[]): MenuItem {
    return item(menu, 'Draw Opaque');
  }

  it('checks Options > Draw Opaque to match the flag', () => {
    expect(drawOpaqueItem(getMenuStructure(FLAGS)).checked).toBe(true);
    expect(drawOpaqueItem(getMenuStructure({ ...FLAGS, drawOpaque: false })).checked).toBe(false);
    expect(drawOpaqueItem(getMenuStructure(FLAGS)).action).toBe(MenuActionType.TOGGLE_DRAW_OPAQUE);
  });

  it('enables View > Text Toolbar only while a text box is open, and checks it while the toolbar is shown', () => {
    expect(item(getMenuStructure(FLAGS), 'Text Toolbar')).toEqual({
      name: 'Text Toolbar',
      action: MenuActionType.TOGGLE_TEXT_TOOLBAR,
      disabled: true,
      checked: true,
    });
    const open: MenuItem = item(
      getMenuStructure({ ...FLAGS, textBoxOpen: true, textToolbarVisible: false }),
      'Text Toolbar'
    );
    expect(open.disabled).toBe(false);
    expect(open.checked).toBe(false);
  });

  it('enables View > Zoom > Show Grid only while the grid is available, and checks it while the grid is shown', () => {
    expect(item(getMenuStructure(FLAGS), 'Zoom').disabled, 'the submenu itself always opens').toBeFalsy();
    expect(item(getMenuStructure(FLAGS), 'Show Grid')).toEqual({
      name: 'Show Grid',
      hotkeys: ['Ctrl', 'G'],
      action: MenuActionType.TOGGLE_SHOW_GRID,
      disabled: true,
      checked: false,
    });
    const shown: MenuItem = item(getMenuStructure({ ...FLAGS, gridAvailable: true, showGrid: true }), 'Show Grid');
    expect(shown.disabled).toBe(false);
    expect(shown.checked).toBe(true);
    const available: MenuItem = item(getMenuStructure({ ...FLAGS, gridAvailable: true }), 'Show Grid');
    expect(available.disabled).toBe(false);
    expect(available.checked).toBe(false);
  });

  it('shows no check mark on Show Grid while the zoom is too low for the grid, even if it is switched on', () => {
    expect(item(getMenuStructure({ ...FLAGS, showGrid: true }), 'Show Grid').checked).toBe(false);
  });

  it('keeps the items that do not depend on a flag', () => {
    const menu: MenuItem[] = getMenuStructure({ ...FLAGS, drawOpaque: false });
    expect(menu.map((item) => item.name)).toEqual(MENU_STRUCTURE.map((item) => item.name));
    expect(menu[0]).toBe(MENU_STRUCTURE[0]);
    expect(flattenMenu(menu).length).toBe(flattenMenu(MENU_STRUCTURE).length);
    expect(drawOpaqueItem(MENU_STRUCTURE).checked, 'the base structure is not changed').toBeUndefined();
  });
});

describe('NON_MENU_SHORTCUTS', () => {
  it('maps Escape to deselect', () => {
    expect(NON_MENU_SHORTCUTS.length).toBe(1);
    expect(NON_MENU_SHORTCUTS[0].hotkeys).toEqual(['Escape']);
    expect(NON_MENU_SHORTCUTS[0].action).toBeDefined();
  });
});

describe('DEFAULT_DRAWING_TOOL_OPTIONS', () => {
  it('has an entry for each tool with options', () => {
    expect(
      Object.keys(DEFAULT_DRAWING_TOOL_OPTIONS)
        .map(Number)
        .sort((a, b) => a - b)
    ).toEqual(
      [
        DrawingToolType.rectangleSelect,
        DrawingToolType.text,
        DrawingToolType.rectangle,
        DrawingToolType.line,
        DrawingToolType.eraser,
        DrawingToolType.brush,
      ].sort((a, b) => a - b)
    );
  });

  it('starts the text tool with plain 10pt Arial', () => {
    expect(DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.text]).toEqual({
      fontFamily: 'Arial',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
    });
  });

  it('starts with Draw Opaque on like MS Paint', () => {
    expect(DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.rectangleSelect]).toEqual({ drawOpaque: true });
  });

  it('starts with an empty rectangle, a 1px line and the 8px eraser like MS Paint', () => {
    expect(DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.rectangle]).toEqual({ fillType: FillType.EMPTY });
    expect(DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.line]).toEqual({ thickness: 1 });
    expect(DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.eraser]).toEqual({ size: 8 });
  });

  it('starts with the medium round brush, which is one of the picker shapes', () => {
    const shape = DEFAULT_DRAWING_TOOL_OPTIONS[DrawingToolType.brush].shape;
    expect(shape).toEqual({ form: BrushForm.ROUND, size: 4 });
    expect(ALL_BRUSH_SHAPES.some((other) => brushShapesEqual(shape, other))).toBe(true);
  });
});
