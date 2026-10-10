import { Mock, vi } from 'vitest';
import { DrawingTool } from './drawing-tool';
import { DrawingToolType } from './drawing-tool-type';
import { DrawingToolAction } from '../actions/drawing-tool-actions/drawing-tool-action';
import { TsPaintAction } from '../actions/ts-paint-action';
import { TspMouseEvent } from '../mouse-tracker/tsp-mouse-event';
import { MouseButton } from '../mouse-tracker/mouse-button';
import { Point } from '../base/point';
import { PencilAction } from '../actions/drawing-tool-actions/pencil-action';
import { LineAction } from '../actions/drawing-tool-actions/line-action';
import { ColorFillerAction } from '../actions/drawing-tool-actions/color-filler-action';
import { MagnifierAction } from '../actions/drawing-tool-actions/magnifier-action';
import { RectangleAction } from '../actions/drawing-tool-actions/rectangle-action';
import { EllipseAction } from '../actions/drawing-tool-actions/ellipse-action';

interface ToolHarness {
  tool: DrawingTool;
  /** Every action the tool emitted through its addAction callback, in order */
  actions: DrawingToolAction[];
  clearPreview: Mock<() => void>;
}

function createTool(type: DrawingToolType): ToolHarness {
  const actions: DrawingToolAction[] = [];
  const clearPreview: Mock<() => void> = vi.fn();
  const tool: DrawingTool = new DrawingTool(
    type,
    (action: TsPaintAction) => actions.push(action as DrawingToolAction),
    clearPreview
  );
  return { tool, actions, clearPreview };
}

function at(w: number, h: number, extra: Partial<TspMouseEvent> = {}): TspMouseEvent {
  return { point: { w, h }, button: MouseButton.LEFT, ...extra };
}

function shiftAt(w: number, h: number): TspMouseEvent {
  return at(w, h, { shiftKey: true });
}

/** Clone of the points at the moment of the call (free-draw tools keep pushing into the same array) */
function pointsOf(action: DrawingToolAction): Point[] {
  return action.points.map((point) => ({ ...point }));
}

describe('DrawingTool', () => {
  describe('constructor and getters', () => {
    it('exposes the tool type it was created with', () => {
      expect(createTool(DrawingToolType.line).tool.type).toBe(DrawingToolType.line);
    });

    it('returns the configured help text, or an empty string when the tool has none', () => {
      expect(createTool(DrawingToolType.magnifier).tool.helpText).toBe(
        'Changes the magnification: left click to zoom in, right click to zoom out.'
      );
      expect(createTool(DrawingToolType.pencil).tool.helpText).toBe('');
    });

    it('returns whether the preview is inverted, defaulting to false', () => {
      expect(createTool(DrawingToolType.magnifier).tool.invertedPreview).toBe(true);
      expect(createTool(DrawingToolType.rectangleSelect).tool.invertedPreview).toBe(true);
      expect(createTool(DrawingToolType.pencil).tool.invertedPreview).toBe(false);
    });

    it('starts without a preview shape', () => {
      const { tool } = createTool(DrawingToolType.line);
      expect(tool.previewShapeStart).toBeUndefined();
      expect(tool.previewShapeDimensions).toBeUndefined();
    });
  });

  describe('FREE_DRAW behaviour (pencil)', () => {
    it('emits nothing on mouse down alone', () => {
      const { tool, actions } = createTool(DrawingToolType.pencil);
      tool.mouseDown(at(1, 1));
      expect(actions).toEqual([]);
    });

    it('emits a preview action with all points so far on every move while the mouse is down', () => {
      const { tool, actions } = createTool(DrawingToolType.pencil);
      tool.mouseDown(at(1, 1));
      tool.mouseMove(at(2, 1));
      expect(actions.length).toBe(1);
      expect(actions[0]).toBeInstanceOf(PencilAction);
      expect(actions[0].renderIn).toBe('preview');
      expect(pointsOf(actions[0])).toEqual([
        { w: 1, h: 1 },
        { w: 2, h: 1 },
      ]);

      tool.mouseMove(at(3, 2));
      expect(actions.length).toBe(2);
      expect(pointsOf(actions[1])).toEqual([
        { w: 1, h: 1 },
        { w: 2, h: 1 },
        { w: 3, h: 2 },
      ]);
    });

    it('ignores moves while the mouse is up', () => {
      const { tool, actions } = createTool(DrawingToolType.pencil);
      tool.mouseMove(at(2, 1));
      expect(actions).toEqual([]);
    });

    it('emits the final image action with the mouse up point appended, then starts the next stroke afresh', () => {
      const { tool, actions } = createTool(DrawingToolType.pencil);
      tool.mouseDown(at(1, 1));
      tool.mouseMove(at(2, 1));
      tool.mouseUp(at(3, 1));

      expect(actions.length).toBe(2);
      expect(actions[1].renderIn).toBe('image');
      expect(pointsOf(actions[1])).toEqual([
        { w: 1, h: 1 },
        { w: 2, h: 1 },
        { w: 3, h: 1 },
      ]);

      tool.mouseMove(at(4, 1));
      expect(actions.length, 'the stroke is finished, moving does not preview').toBe(2);

      tool.mouseDown(at(10, 10));
      tool.mouseUp(at(11, 10));
      expect(pointsOf(actions[2])).toEqual([
        { w: 10, h: 10 },
        { w: 11, h: 10 },
      ]);
    });

    it('is not snapped by the shift key', () => {
      const { tool, actions } = createTool(DrawingToolType.pencil);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(shiftAt(20, 12));
      tool.mouseUp(shiftAt(21, 13));
      expect(pointsOf(actions[1])).toEqual([
        { w: 10, h: 10 },
        { w: 20, h: 12 },
        { w: 21, h: 13 },
      ]);
    });
  });

  describe('CLICK_AND_DRAG behaviour (line)', () => {
    it('previews from the mouse down point to the current point while dragging', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(1, 1));
      tool.mouseMove(at(5, 3));
      tool.mouseMove(at(6, 4));

      expect(actions.length).toBe(2);
      expect(actions[0]).toBeInstanceOf(LineAction);
      expect(actions[0].renderIn).toBe('preview');
      expect(actions[0].points).toEqual([
        { w: 1, h: 1 },
        { w: 5, h: 3 },
      ]);
      expect(actions[1].points).toEqual([
        { w: 1, h: 1 },
        { w: 6, h: 4 },
      ]);
    });

    it('does not preview when the mouse is not down', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseMove(at(5, 3));
      expect(actions).toEqual([]);
    });

    it('emits the final image action from the mouse down point to the mouse up point', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(1, 1));
      tool.mouseMove(at(5, 3));
      tool.mouseUp(at(7, 2));

      expect(actions.length).toBe(2);
      expect(actions[1].renderIn).toBe('image');
      expect(actions[1].points).toEqual([
        { w: 1, h: 1 },
        { w: 7, h: 2 },
      ]);
    });

    it('sets the preview shape start and dimensions during a drag and clears them on mouse up', () => {
      const { tool } = createTool(DrawingToolType.line);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(at(14, 12));
      expect(tool.previewShapeStart).toEqual({ w: 10, h: 10 });
      expect(tool.previewShapeDimensions).toEqual({ w: 5, h: 3 });

      tool.mouseMove(at(7, 10));
      expect(tool.previewShapeDimensions, 'negative width when dragging left').toEqual({ w: -4, h: 1 });

      tool.mouseUp(at(7, 10));
      expect(tool.previewShapeStart).toBeUndefined();
      expect(tool.previewShapeDimensions).toBeUndefined();
    });
  });

  describe('SINGLE_POINT behaviour (color filler)', () => {
    it('emits only the final action on mouse up, with the mouse up point', () => {
      const { tool, actions } = createTool(DrawingToolType.colorFiller);
      tool.mouseDown(at(3, 3));
      tool.mouseMove(at(4, 4));
      expect(actions).toEqual([]);

      tool.mouseUp(at(5, 5));
      expect(actions.length).toBe(1);
      expect(actions[0]).toBeInstanceOf(ColorFillerAction);
      expect(actions[0].renderIn).toBe('image');
      expect(actions[0].points).toEqual([{ w: 5, h: 5 }]);
    });

    it('emits nothing on moves without a click', () => {
      const { tool, actions } = createTool(DrawingToolType.colorFiller);
      tool.mouseMove(at(4, 4));
      expect(actions).toEqual([]);
    });
  });

  describe('SINGLE_POINT_WITH_PREVIEW behaviour (magnifier)', () => {
    it('previews on every move, even without the mouse down', () => {
      const { tool, actions, clearPreview } = createTool(DrawingToolType.magnifier);
      tool.mouseMove(at(4, 4));
      tool.mouseMove(at(5, 6));

      expect(actions.length).toBe(2);
      expect(actions[0]).toBeInstanceOf(MagnifierAction);
      expect(actions[0].renderIn).toBe('preview');
      expect(actions[0].points).toEqual([{ w: 4, h: 4 }]);
      expect(actions[1].points).toEqual([{ w: 5, h: 6 }]);
      expect(tool.previewShapeStart).toEqual({ w: 5, h: 6 });
      expect(clearPreview).not.toHaveBeenCalled();
    });

    it('clears the preview instead of drawing it when the mouse leaves the canvas', () => {
      const { tool, actions, clearPreview } = createTool(DrawingToolType.magnifier);
      tool.mouseMove(at(4, 4, { outsideCanvas: true }));
      expect(actions).toEqual([]);
      expect(clearPreview).toHaveBeenCalledTimes(1);
    });

    it('emits the final action on mouse up', () => {
      const { tool, actions } = createTool(DrawingToolType.magnifier);
      tool.mouseDown(at(4, 4));
      tool.mouseUp(at(4, 4));
      expect(actions.length).toBe(1);
      expect(actions[0].renderIn).toBe('image');
      expect(actions[0].points).toEqual([{ w: 4, h: 4 }]);
    });

    it('is not snapped by the shift key', () => {
      const { tool, actions } = createTool(DrawingToolType.magnifier);
      tool.mouseMove(shiftAt(20, 12));
      expect(actions[0].points).toEqual([{ w: 20, h: 12 }]);
    });
  });

  describe('mouse buttons', () => {
    it('emits actions with swapColors false for the left button', () => {
      const { tool, actions } = createTool(DrawingToolType.pencil);
      tool.mouseDown(at(1, 1, { button: MouseButton.LEFT }));
      tool.mouseMove(at(2, 1));
      tool.mouseUp(at(3, 1));
      expect(actions.map((action) => action.swapColors)).toEqual([false, false]);
    });

    it('emits actions with swapColors true for the right button, for the preview and the final action', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(1, 1, { button: MouseButton.RIGHT }));
      tool.mouseMove(at(2, 1));
      tool.mouseUp(at(3, 1));
      expect(actions.map((action) => action.swapColors)).toEqual([true, true]);
    });

    it('treats any button other than the left one as swapping colors', () => {
      const { tool, actions } = createTool(DrawingToolType.colorFiller);
      tool.mouseDown(at(1, 1, { button: MouseButton.MIDDLE }));
      tool.mouseUp(at(1, 1));
      expect(actions[0].swapColors).toBe(true);
    });

    it('forgets the button after the stroke is finished', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(1, 1, { button: MouseButton.RIGHT }));
      tool.mouseUp(at(3, 1));
      tool.mouseDown(at(1, 1, { button: MouseButton.LEFT }));
      tool.mouseUp(at(3, 1));
      expect(actions.map((action) => action.swapColors)).toEqual([true, false]);
    });
  });

  describe('shift snapping EVERY_45_DEGREES (line)', () => {
    function lineEndWithShift(end: Point): Point {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(shiftAt(end.w, end.h));
      return actions[0].points[1];
    }

    it('snaps a mostly horizontal drag onto the horizontal axis, keeping the longer delta', () => {
      expect(lineEndWithShift({ w: 20, h: 12 })).toEqual({ w: 20, h: 10 });
      expect(lineEndWithShift({ w: 0, h: 13 })).toEqual({ w: 0, h: 10 });
    });

    it('snaps a mostly vertical drag onto the vertical axis', () => {
      expect(lineEndWithShift({ w: 12, h: 20 })).toEqual({ w: 10, h: 20 });
      expect(lineEndWithShift({ w: 9, h: 2 })).toEqual({ w: 10, h: 2 });
    });

    it('snaps a drag within the 45 degree band onto the diagonal, keeping the shorter delta', () => {
      expect(lineEndWithShift({ w: 18, h: 17 })).toEqual({ w: 17, h: 17 });
      expect(lineEndWithShift({ w: 2, h: 4 })).toEqual({ w: 4, h: 4 });
      expect(lineEndWithShift({ w: 15, h: 1 })).toEqual({ w: 15, h: 5 });
    });

    it('treats the edge of the band (one delta exactly half the other) as an axis snap', () => {
      expect(lineEndWithShift({ w: 20, h: 15 })).toEqual({ w: 20, h: 10 });
    });

    it('does not snap without the shift key', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(at(20, 12));
      expect(actions[0].points[1]).toEqual({ w: 20, h: 12 });
    });

    it('snaps the final point of the mouse up as well', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(10, 10));
      tool.mouseUp(shiftAt(20, 12));
      expect(actions[0].renderIn).toBe('image');
      expect(actions[0].points).toEqual([
        { w: 10, h: 10 },
        { w: 20, h: 10 },
      ]);
    });

    it('snaps relative to the mouse down point of the current drag only', () => {
      const { tool, actions } = createTool(DrawingToolType.line);
      tool.mouseDown(at(10, 10));
      tool.mouseUp(at(20, 20));
      tool.mouseDown(at(50, 50));
      tool.mouseMove(shiftAt(60, 52));
      expect(actions[1].points).toEqual([
        { w: 50, h: 50 },
        { w: 60, h: 50 },
      ]);
    });
  });

  describe('shift snapping DIAGONAL (rectangle and ellipse)', () => {
    function shapeEndWithShift(type: DrawingToolType, end: Point): DrawingToolAction {
      const { tool, actions } = createTool(type);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(shiftAt(end.w, end.h));
      return actions[0];
    }

    it('turns a rectangle into a square using the shorter delta', () => {
      const action: DrawingToolAction = shapeEndWithShift(DrawingToolType.rectangle, { w: 20, h: 14 });
      expect(action).toBeInstanceOf(RectangleAction);
      expect(action.points[1]).toEqual({ w: 14, h: 14 });
    });

    it('snaps to the diagonal even when the drag is almost on an axis', () => {
      expect(shapeEndWithShift(DrawingToolType.rectangle, { w: 20, h: 12 }).points[1]).toEqual({ w: 12, h: 12 });
    });

    it('keeps the drag direction in both axes', () => {
      expect(shapeEndWithShift(DrawingToolType.rectangle, { w: 0, h: 16 }).points[1]).toEqual({ w: 4, h: 16 });
      expect(shapeEndWithShift(DrawingToolType.rectangle, { w: 3, h: 1 }).points[1]).toEqual({ w: 3, h: 3 });
    });

    it('turns an ellipse into a circle', () => {
      const action: DrawingToolAction = shapeEndWithShift(DrawingToolType.ellipse, { w: 13, h: 30 });
      expect(action).toBeInstanceOf(EllipseAction);
      expect(action.points[1]).toEqual({ w: 13, h: 13 });
    });

    it('updates the preview shape dimensions with the snapped point', () => {
      const { tool } = createTool(DrawingToolType.rectangle);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(shiftAt(20, 14));
      expect(tool.previewShapeDimensions).toEqual({ w: 5, h: 5 });
    });

    it('does not snap without the shift key', () => {
      const { tool, actions } = createTool(DrawingToolType.ellipse);
      tool.mouseDown(at(10, 10));
      tool.mouseMove(at(20, 14));
      expect(actions[0].points[1]).toEqual({ w: 20, h: 14 });
    });
  });
});
