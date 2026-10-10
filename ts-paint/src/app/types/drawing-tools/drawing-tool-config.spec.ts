import { DRAWING_TOOL_CONFIG, DRAWING_TOOL_CONFIG_DEFAULTS, DrawingToolConfig } from './drawing-tool-config';
import { ALL_DRAWING_TOOL_TYPES, DrawingToolType } from './drawing-tool-type';
import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolAngleSnap } from './drawing-tool-angle-snap';
import { ALL_BRUSH_SHAPES, BrushForm, brushShapesEqual } from './brush-shape';
import { RectangleSelectAction } from '../actions/drawing-tool-actions/rectangle-select-action';
import { EraserAction } from '../actions/drawing-tool-actions/eraser-action';
import { ColorFillerAction } from '../actions/drawing-tool-actions/color-filler-action';
import { ColorPickerAction } from '../actions/drawing-tool-actions/color-picker-action';
import { MagnifierAction } from '../actions/drawing-tool-actions/magnifier-action';
import { PencilAction } from '../actions/drawing-tool-actions/pencil-action';
import { BrushAction } from '../actions/drawing-tool-actions/brush-action';
import { LineAction } from '../actions/drawing-tool-actions/line-action';
import { RectangleAction } from '../actions/drawing-tool-actions/rectangle-action';
import { EllipseAction } from '../actions/drawing-tool-actions/ellipse-action';

const { FREE_DRAW, SINGLE_POINT, SINGLE_POINT_WITH_PREVIEW, CLICK_AND_DRAG } = DrawingToolBehaviour;
const { NONE, DIAGONAL, EVERY_45_DEGREES } = DrawingToolAngleSnap;

describe('ALL_DRAWING_TOOL_TYPES', () => {
  it('lists the 10 implemented tools in toolbox order', () => {
    expect(ALL_DRAWING_TOOL_TYPES).toEqual([
      DrawingToolType.rectangleSelect,
      DrawingToolType.eraser,
      DrawingToolType.colorFiller,
      DrawingToolType.colorPicker,
      DrawingToolType.magnifier,
      DrawingToolType.pencil,
      DrawingToolType.brush,
      DrawingToolType.line,
      DrawingToolType.rectangle,
      DrawingToolType.ellipse,
    ]);
  });

  it('contains only numeric enum values', () => {
    expect(ALL_DRAWING_TOOL_TYPES.every((type) => typeof type === 'number')).toBe(true);
  });
});

describe('DRAWING_TOOL_CONFIG', () => {
  interface ExpectedConfig {
    tool: DrawingToolType;
    behaviour: DrawingToolBehaviour;
    maxPoints: number;
    angleSnap: DrawingToolAngleSnap;
    invertedPreview: boolean;
    actionClass: DrawingToolConfig['actionClass'];
  }

  const expected: ExpectedConfig[] = [
    {
      tool: DrawingToolType.rectangleSelect,
      behaviour: CLICK_AND_DRAG,
      maxPoints: 2,
      angleSnap: NONE,
      invertedPreview: true,
      actionClass: RectangleSelectAction,
    },
    {
      tool: DrawingToolType.eraser,
      behaviour: FREE_DRAW,
      maxPoints: 1,
      angleSnap: NONE,
      invertedPreview: false,
      actionClass: EraserAction,
    },
    {
      tool: DrawingToolType.colorFiller,
      behaviour: SINGLE_POINT,
      maxPoints: 1,
      angleSnap: NONE,
      invertedPreview: false,
      actionClass: ColorFillerAction,
    },
    {
      tool: DrawingToolType.colorPicker,
      behaviour: SINGLE_POINT,
      maxPoints: 1,
      angleSnap: NONE,
      invertedPreview: false,
      actionClass: ColorPickerAction,
    },
    {
      tool: DrawingToolType.magnifier,
      behaviour: SINGLE_POINT_WITH_PREVIEW,
      maxPoints: 1,
      angleSnap: NONE,
      invertedPreview: true,
      actionClass: MagnifierAction,
    },
    {
      tool: DrawingToolType.pencil,
      behaviour: FREE_DRAW,
      maxPoints: 1,
      angleSnap: NONE,
      invertedPreview: false,
      actionClass: PencilAction,
    },
    {
      tool: DrawingToolType.brush,
      behaviour: FREE_DRAW,
      maxPoints: 1,
      angleSnap: NONE,
      invertedPreview: false,
      actionClass: BrushAction,
    },
    {
      tool: DrawingToolType.line,
      behaviour: CLICK_AND_DRAG,
      maxPoints: 2,
      angleSnap: EVERY_45_DEGREES,
      invertedPreview: false,
      actionClass: LineAction,
    },
    {
      tool: DrawingToolType.rectangle,
      behaviour: CLICK_AND_DRAG,
      maxPoints: 2,
      angleSnap: DIAGONAL,
      invertedPreview: false,
      actionClass: RectangleAction,
    },
    {
      tool: DrawingToolType.ellipse,
      behaviour: CLICK_AND_DRAG,
      maxPoints: 2,
      angleSnap: DIAGONAL,
      invertedPreview: false,
      actionClass: EllipseAction,
    },
  ];

  expected.forEach(({ tool, ...rest }) => {
    it(`configures the ${DrawingToolType[tool]} tool`, () => {
      const config: DrawingToolConfig = DRAWING_TOOL_CONFIG[tool];
      expect(config.behaviour).toBe(rest.behaviour);
      expect(config.maxPoints).toBe(rest.maxPoints);
      expect(config.angleSnap).toBe(rest.angleSnap);
      expect(config.invertedPreview).toBe(rest.invertedPreview);
      expect(config.actionClass).toBe(rest.actionClass);
    });
  });

  it('has an entry for every tool and nothing else', () => {
    const configuredTools: number[] = Object.keys(DRAWING_TOOL_CONFIG).map(Number);
    expect(configuredTools.sort((a, b) => a - b)).toEqual([...ALL_DRAWING_TOOL_TYPES].sort((a, b) => a - b));
  });

  it('only gives the magnifier a help text', () => {
    ALL_DRAWING_TOOL_TYPES.forEach((tool) => {
      const helpText: string = DRAWING_TOOL_CONFIG[tool].helpText;
      if (tool === DrawingToolType.magnifier) {
        expect(helpText.length).toBeGreaterThan(0);
      } else {
        expect(helpText, DrawingToolType[tool]).toBe(DRAWING_TOOL_CONFIG_DEFAULTS.helpText);
      }
    });
  });

  it('allows exactly 2 points for click-and-drag tools and 1 for the rest', () => {
    ALL_DRAWING_TOOL_TYPES.forEach((tool) => {
      const config: DrawingToolConfig = DRAWING_TOOL_CONFIG[tool];
      const expectedPoints: number = config.behaviour === CLICK_AND_DRAG ? 2 : 1;
      expect(config.maxPoints, DrawingToolType[tool]).toBe(expectedPoints);
    });
  });
});

describe('DRAWING_TOOL_CONFIG_DEFAULTS', () => {
  it('describes a plain single point tool', () => {
    expect(DRAWING_TOOL_CONFIG_DEFAULTS).toEqual({
      behaviour: SINGLE_POINT,
      maxPoints: 1,
      helpText: '',
      invertedPreview: false,
      angleSnap: NONE,
    });
  });
});

describe('brushShapesEqual', () => {
  it('is true for the same form and size', () => {
    expect(brushShapesEqual({ form: BrushForm.ROUND, size: 4 }, { form: BrushForm.ROUND, size: 4 })).toBe(true);
    expect(brushShapesEqual(ALL_BRUSH_SHAPES[3], { ...ALL_BRUSH_SHAPES[3] })).toBe(true);
  });

  it('is false when the form differs', () => {
    expect(brushShapesEqual({ form: BrushForm.ROUND, size: 4 }, { form: BrushForm.SQUARE, size: 4 })).toBe(false);
  });

  it('is false when the size differs', () => {
    expect(brushShapesEqual({ form: BrushForm.ROUND, size: 4 }, { form: BrushForm.ROUND, size: 7 })).toBe(false);
  });

  it('is false when either shape is missing', () => {
    expect(brushShapesEqual(undefined, { form: BrushForm.ROUND, size: 4 })).toBe(false);
    expect(brushShapesEqual({ form: BrushForm.ROUND, size: 4 }, undefined)).toBe(false);
    expect(brushShapesEqual(undefined, undefined)).toBe(false);
  });
});

describe('ALL_BRUSH_SHAPES', () => {
  it('lists the 12 distinct MS Paint brushes', () => {
    expect(ALL_BRUSH_SHAPES.length).toBe(12);
    ALL_BRUSH_SHAPES.forEach((shape, index) => {
      const duplicates: number = ALL_BRUSH_SHAPES.filter((other) => brushShapesEqual(shape, other)).length;
      expect(duplicates, `shape ${index}`).toBe(1);
    });
  });
});
