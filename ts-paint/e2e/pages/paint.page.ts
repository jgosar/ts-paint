import { expect, Locator, Page } from '@playwright/test';
import { ALL_DRAWING_TOOL_TYPES, DrawingToolType } from '../../src/app/types/drawing-tools/drawing-tool-type';
import { imageSize } from '../helpers/pixels';

export type MouseButton = 'left' | 'right';

/** Drives the Paint window the way a user does: toolbox, palette, menus, keyboard and the canvas */
export class PaintPage {
  readonly toolbox: Locator;
  readonly toolOptions: Locator;
  readonly toolbar: Locator;
  readonly palette: Locator;
  readonly canvasTracker: Locator;
  readonly selectionFrame: Locator;
  readonly windowTitle: Locator;

  constructor(readonly page: Page) {
    this.toolbox = page.locator('tsp-toolbox');
    this.toolOptions = page.locator('tsp-drawing-tool-options');
    // The vertical bar holding both the toolbox and the tool options
    this.toolbar = page.locator('tsp-toolbox').locator('xpath=..');
    this.palette = page.locator('tsp-palette');
    this.canvasTracker = page.locator('.tsp-mouse-tracker__div');
    // The host elements of the frame and the dialogs have no box of their own, so target their sized children
    this.selectionFrame = page.locator('tsp-selection-frame .tsp-selection-frame__frame');
    this.windowTitle = page.locator('tsp-ts-paint > tsp-modal-window .tsp-modal-window__title-bar').first();
  }

  async goto(query: string = ''): Promise<void> {
    await this.page.goto('/' + query, { waitUntil: 'networkidle' });
    await this.page.evaluate(() => document.fonts.ready);
    await expect(this.canvasTracker).toBeVisible();
  }

  toolButton(tool: DrawingToolType): Locator {
    return this.page.locator('.tsp-toolbox__button').nth(ALL_DRAWING_TOOL_TYPES.indexOf(tool));
  }

  async selectTool(tool: DrawingToolType): Promise<void> {
    await this.toolButton(tool).click();
    await expect(this.toolButton(tool)).toHaveClass(/tsp-toolbox__button--selected/);
  }

  /** The n-th option of whatever picker the current tool shows (thickness, fill type, eraser size, brush shape) */
  pickerOption(index: number): Locator {
    return this.toolOptions.locator('[class$="__option"], [class*="__option "]').nth(index);
  }

  async selectPickerOption(index: number): Promise<void> {
    await this.pickerOption(index).click();
    await expect(this.pickerOption(index)).toHaveClass(/--selected/);
  }

  swatch(index: number): Locator {
    return this.page.locator('.tsp-palette__color-button').nth(index);
  }

  async setPrimaryColor(index: number): Promise<void> {
    await this.swatch(index).click();
  }

  async setSecondaryColor(index: number): Promise<void> {
    await this.swatch(index).click({ button: 'right' });
  }

  /** Background color of the primary / secondary sample in the palette, as 'rgb(r, g, b)' */
  async sampleColor(which: 'primary' | 'secondary'): Promise<string> {
    const samples: Locator = this.page.locator('.tsp-palette__selected-color-container');
    // The template renders the secondary sample first (it sits behind the primary one)
    const sample: Locator = samples.nth(which === 'secondary' ? 0 : 1);
    return sample.evaluate((element: HTMLElement) => getComputedStyle(element).backgroundColor);
  }

  /** Viewport coordinates of the centre of an image pixel, valid at any zoom or device scale */
  async canvasPoint(w: number, h: number): Promise<{ x: number; y: number }> {
    const box = await this.canvasTracker.boundingBox();
    const { width, height } = await imageSize(this.page);
    return { x: box.x + ((w + 0.5) * box.width) / width, y: box.y + ((h + 0.5) * box.height) / height };
  }

  async clickCanvas(w: number, h: number, button: MouseButton = 'left'): Promise<void> {
    const point = await this.canvasPoint(w, h);
    await this.page.mouse.click(point.x, point.y, { button });
  }

  /** Presses at the first point, moves through the others in small steps and releases at the last one */
  async drag(points: [number, number][], options: { button?: MouseButton; shift?: boolean } = {}): Promise<void> {
    const button: MouseButton = options.button ?? 'left';
    if (options.shift) {
      await this.page.keyboard.down('Shift');
    }
    const start = await this.canvasPoint(points[0][0], points[0][1]);
    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down({ button });
    for (const [w, h] of points.slice(1)) {
      const target = await this.canvasPoint(w, h);
      await this.page.mouse.move(target.x, target.y, { steps: 5 });
    }
    await this.page.mouse.up({ button });
    if (options.shift) {
      await this.page.keyboard.up('Shift');
    }
  }

  async openMenu(menuName: string): Promise<Locator> {
    const menu: Locator = this.page.locator('.tsp-menu__menu-level-1', { hasText: new RegExp(`^\\s*${menuName}\\b`) });
    await menu.click();
    await menu.hover();
    const dropdown: Locator = menu.locator('.tsp-menu__menu-level-2-container');
    await expect(dropdown).toBeVisible();
    return menu;
  }

  /** A second-level item by its exact name ('Save' does not match 'Save As...'); a trailing '...' is optional */
  menuItem(menu: Locator, itemName: string): Locator {
    const escaped: string = itemName.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    const exactName: RegExp = new RegExp(`^\\s*${escaped}(\\.\\.\\.)?\\s*$`);
    return menu.locator('.tsp-menu__menu-level-2').filter({ has: this.page.locator('div', { hasText: exactName }) });
  }

  async menu(menuName: string, itemName: string): Promise<void> {
    const menu: Locator = await this.openMenu(menuName);
    await this.menuItem(menu, itemName).click();
  }

  async hotkey(keys: string): Promise<void> {
    await this.page.keyboard.press(keys);
  }

  window(
    selector:
      | 'tsp-attributes-window'
      | 'tsp-save-as-window'
      | 'tsp-flip-rotate-window'
      | 'tsp-stretch-skew-window'
      | 'tsp-about-paint-window'
  ): Locator {
    return this.page.locator(selector).locator('.tsp-modal-window__container');
  }

  /** Radio inputs are 0px wide (custom drawn), so pick them through their label text */
  async chooseRadio(window: Locator, label: string): Promise<void> {
    await window.getByText(label, { exact: true }).click();
  }

  async setIntegerInput(window: Locator, label: string, value: string): Promise<void> {
    const input: Locator = window.locator('tsp-integer-input', { hasText: label }).locator('input');
    // The integer input validates every keystroke itself, so select the text through the DOM and type over it
    await input.click();
    await input.selectText();
    await input.pressSequentially(value);
  }

  async clickButton(window: Locator, text: string): Promise<void> {
    await window.getByRole('button', { name: text, exact: true }).click();
  }
}
