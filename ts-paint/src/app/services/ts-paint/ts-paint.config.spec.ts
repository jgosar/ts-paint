import {
  COLOR_WHITE,
  DEFAULT_AVAILABLE_COLORS,
  DEFAULT_DRAWING_TOOL_OPTIONS,
  MENU_STRUCTURE,
  NON_MENU_SHORTCUTS,
} from './ts-paint.config';
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
      [DrawingToolType.rectangle, DrawingToolType.line, DrawingToolType.eraser, DrawingToolType.brush].sort(
        (a, b) => a - b
      )
    );
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
