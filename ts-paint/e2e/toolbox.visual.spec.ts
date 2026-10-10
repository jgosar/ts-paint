import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { ALL_DRAWING_TOOL_TYPES, DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { ALL_LINE_THICKNESSES } from '../src/app/types/drawing-tools/line-thickness';
import { ALL_ERASER_SIZES } from '../src/app/types/drawing-tools/eraser-size';
import { ALL_BRUSH_SHAPES } from '../src/app/types/drawing-tools/brush-shape';

test.describe('toolbox and tool options', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
  });

  for (const tool of ALL_DRAWING_TOOL_TYPES) {
    test(`${DrawingToolType[tool]} selected`, async () => {
      await paint.selectTool(tool);
      await expect(paint.toolbar).toHaveScreenshot(`toolbar-${DrawingToolType[tool]}.png`);
    });
  }

  for (const [index, thickness] of ALL_LINE_THICKNESSES.entries()) {
    test(`line thickness ${thickness}`, async () => {
      await paint.selectTool(DrawingToolType.line);
      await paint.selectPickerOption(index);
      await expect(paint.toolOptions).toHaveScreenshot(`options-line-${thickness}.png`);
    });
  }

  for (const [index, fillType] of ['empty', 'secondary', 'primary'].entries()) {
    test(`rectangle fill ${fillType}`, async () => {
      await paint.selectTool(DrawingToolType.rectangle);
      await paint.selectPickerOption(index);
      await expect(paint.toolOptions).toHaveScreenshot(`options-rectangle-${fillType}.png`);
    });
  }

  for (const [index, size] of ALL_ERASER_SIZES.entries()) {
    test(`eraser size ${size}`, async () => {
      await paint.selectTool(DrawingToolType.eraser);
      await paint.selectPickerOption(index);
      await expect(paint.toolOptions).toHaveScreenshot(`options-eraser-${size}.png`);
    });
  }

  for (const [index, shape] of ALL_BRUSH_SHAPES.entries()) {
    test(`brush shape ${index} (form ${shape.form}, size ${shape.size})`, async () => {
      await paint.selectTool(DrawingToolType.brush);
      await paint.selectPickerOption(index);
      await expect(paint.toolOptions).toHaveScreenshot(`options-brush-${index}.png`);
    });
  }
});
