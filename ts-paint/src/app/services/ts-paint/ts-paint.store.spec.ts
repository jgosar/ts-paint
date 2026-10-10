import { MockInstance, vi } from 'vitest';
import { TsPaintStore } from './ts-paint.store';
import { TsPaintStoreState } from './ts-paint.store.state';
import { createTestState } from 'src/testing/state.factory';
import { BLACK, BLUE, RED, WHITE, isColor, pointsOfColor, setPixel } from 'src/testing/image-test.helpers';
import {
  FakeFileHandle,
  FileSystemAccessStubs,
  createAbortError,
  createImageDataUrl,
  createImageFile,
  removeFileSystemAccess,
  restoreFileSystemAccess,
  stubFileSystemAccess,
} from 'src/testing/file-system.fakes';
import { createImage } from 'src/app/helpers/image.helpers';
import { getPixel } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { TspMouseEvent } from 'src/app/types/mouse-tracker/tsp-mouse-event';
import { MouseButton } from 'src/app/types/mouse-tracker/mouse-button';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { DrawingTool } from 'src/app/types/drawing-tools/drawing-tool';
import { MoveSelectionTool } from 'src/app/types/drawing-tools/move-selection-tool';
import { MenuActionType } from 'src/app/types/menu/menu-action-type';
import { PencilAction } from 'src/app/types/actions/drawing-tool-actions/pencil-action';
import { OpenFileAction } from 'src/app/types/actions/open-file-action';
import { Color } from 'src/app/types/base/color';

function createStore(overrides: Partial<TsPaintStoreState> = {}): TsPaintStore {
  const store: TsPaintStore = new TsPaintStore();
  store.setState(createTestState(overrides));
  return store;
}

/** A 100x100 white image with a single black pixel at (12, 12) */
function imageWithBlackPixel(): ImageData {
  const image: ImageData = createImage(100, 100, WHITE);
  setPixel(image, { w: 12, h: 12 }, BLACK);
  return image;
}

function at(w: number, h: number, extra: Partial<TspMouseEvent> = {}): TspMouseEvent {
  return { point: { w, h }, button: MouseButton.LEFT, ...extra };
}

/** Draws a line with the selected (free-draw) tool: down at `from`, one move to `to`, up at `to` */
function stroke(store: TsPaintStore, from: Point, to: Point, button: MouseButton = MouseButton.LEFT): void {
  store.processMouseDown(at(from.w, from.h, { button }));
  store.processMouseMove(at(to.w, to.h, { button }));
  store.processMouseUp(at(to.w, to.h, { button }));
}

/** Selects the rectangle with the rectangle select tool, leaving it as the selected tool */
function selectArea(store: TsPaintStore, start: Point, end: Point): void {
  store.setDrawingTool(DrawingToolType.rectangleSelect);
  store.processMouseDown(at(start.w, start.h));
  store.processMouseUp(at(end.w, end.h));
}

function pixel(store: TsPaintStore, w: number, h: number): Color {
  return getPixel({ w, h }, store.state.image);
}

function keyEvent(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

/** Lets pending promise callbacks (and a macrotask) run */
function settle(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('TsPaintStore', () => {
  describe('drawing with the mouse', () => {
    it('ignores mouse events before a drawing tool is selected', () => {
      const store: TsPaintStore = createStore();
      expect(() => stroke(store, { w: 2, h: 2 }, { w: 5, h: 2 })).not.toThrow();
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([]);
      expect(store.state.actions).toEqual([]);
    });

    it('setDrawingTool creates the tool and logs the change in the history', () => {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.pencil);
      expect(store.state.selectedDrawingTool).toBeInstanceOf(DrawingTool);
      expect(store.state.selectedDrawingTool.type).toBe(DrawingToolType.pencil);
      expect(store.state.actions.length).toBe(1);
      expect(store.state.undoPointer).toBe(0);
    });

    it('previews the stroke while dragging without touching the image or the history', () => {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.pencil);
      store.processMouseDown(at(2, 2));
      store.processMouseMove(at(5, 2));

      expect(store.state.previewImage.width).toBe(4);
      expect(store.state.previewImage.height).toBe(1);
      expect(pointsOfColor(store.state.previewImage, BLACK).length).toBe(4);
      expect(store.state.previewOffset).toEqual({ w: 2, h: 2 });
      expect(store.state.previewAction).toBeInstanceOf(PencilAction);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([]);
      expect(store.state.actions.length).toBe(1);
      expect(store.state.unsavedChanges).toBe(false);
    });

    it('commits the stroke to the image on mouse up and clears the preview', () => {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.pencil);
      stroke(store, { w: 2, h: 2 }, { w: 5, h: 2 });

      expect(pointsOfColor(store.state.image, BLACK)).toEqual([
        { w: 2, h: 2 },
        { w: 3, h: 2 },
        { w: 4, h: 2 },
        { w: 5, h: 2 },
      ]);
      expect(store.state.previewImage.width).toBe(1);
      expect(store.state.previewAction).toBeUndefined();
      expect(store.state.unsavedChanges).toBe(true);
      expect(store.state.actions.length).toBe(2);
      expect(store.state.actions[1]).toBeInstanceOf(PencilAction);
      expect(store.state.undoPointer).toBe(1);
    });

    it('draws with the primary color for the left button and the secondary color for the right button', () => {
      const store: TsPaintStore = createStore();
      store.setColor({ color: RED, primary: true });
      store.setColor({ color: BLUE, primary: false });
      store.setDrawingTool(DrawingToolType.pencil);

      stroke(store, { w: 2, h: 2 }, { w: 5, h: 2 }, MouseButton.LEFT);
      stroke(store, { w: 2, h: 8 }, { w: 5, h: 8 }, MouseButton.RIGHT);

      expect(pixel(store, 3, 2)).toEqual(RED);
      expect(pixel(store, 3, 8)).toEqual(BLUE);
    });

    it('clears the preview when a previewing tool leaves the canvas', () => {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.magnifier);
      store.processMouseMove(at(50, 50));
      expect(store.state.previewImage.width).toBeGreaterThan(1);

      store.processMouseMove(at(50, 50, { outsideCanvas: true }));
      expect(store.state.previewImage.width).toBe(1);
      expect(store.state.previewImage.height).toBe(1);
    });

    it('processMouseMove records the mouse position even without a tool', () => {
      const store: TsPaintStore = createStore();
      store.processMouseMove(at(7, 9));
      expect(store.state.mousePosition).toEqual({ w: 7, h: 9 });
    });
  });

  describe('undo and repeat', () => {
    function storeWithStroke(): TsPaintStore {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.pencil);
      stroke(store, { w: 2, h: 2 }, { w: 5, h: 2 });
      return store;
    }

    it('undo restores the pixels of the last action and moves the undo pointer back', () => {
      const store: TsPaintStore = storeWithStroke();
      store.executeMenuAction(MenuActionType.UNDO);

      expect(pointsOfColor(store.state.image, BLACK)).toEqual([]);
      expect(store.state.undoPointer).toBe(0);
      expect(store.state.actions.length, 'the undone action stays available for repeat').toBe(2);
      expect(store.state.selectionImage, 'undo leaves no selection behind').toBeUndefined();
    });

    it('undo does nothing when there is nothing to undo', () => {
      const store: TsPaintStore = createStore();
      const stateBefore: TsPaintStoreState = store.state;
      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state).toBe(stateBefore);
    });

    it('repeat re-applies the undone action', () => {
      const store: TsPaintStore = storeWithStroke();
      store.executeMenuAction(MenuActionType.UNDO);
      store.executeMenuAction(MenuActionType.REPEAT);

      expect(pointsOfColor(store.state.image, BLACK).length).toBe(4);
      expect(store.state.undoPointer).toBe(1);
      expect(store.state.actions.length).toBe(2);
    });

    it('repeat does nothing when nothing has been undone', () => {
      const store: TsPaintStore = storeWithStroke();
      const stateBefore: TsPaintStoreState = store.state;
      store.executeMenuAction(MenuActionType.REPEAT);
      expect(store.state).toBe(stateBefore);
    });

    it('a new action after undo discards the redo tail', () => {
      const store: TsPaintStore = storeWithStroke();
      store.executeMenuAction(MenuActionType.UNDO);
      stroke(store, { w: 2, h: 8 }, { w: 3, h: 8 });

      expect(store.state.actions.length).toBe(2);
      expect(store.state.undoPointer).toBe(1);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([
        { w: 2, h: 8 },
        { w: 3, h: 8 },
      ]);

      store.executeMenuAction(MenuActionType.REPEAT);
      expect(isColor({ w: 2, h: 2 }, store.state.image, WHITE), 'the discarded stroke cannot come back').toBe(true);
    });

    it('undoes and repeats several steps in order', () => {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.pencil);
      store.setColor({ color: RED, primary: true });
      stroke(store, { w: 2, h: 2 }, { w: 5, h: 2 });

      store.executeMenuAction(MenuActionType.UNDO);
      expect(pointsOfColor(store.state.image, RED)).toEqual([]);
      expect(store.state.primaryColor).toEqual(RED);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.primaryColor).toEqual(BLACK);

      store.executeMenuAction(MenuActionType.REPEAT);
      expect(store.state.primaryColor).toEqual(RED);
      store.executeMenuAction(MenuActionType.REPEAT);
      expect(pointsOfColor(store.state.image, RED).length).toBe(4);
    });
  });

  describe('selection and mouse routing', () => {
    function storeWithSelection(): TsPaintStore {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
      selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });
      return store;
    }

    it('rectangle select lifts the area out of the image into the selection', () => {
      const store: TsPaintStore = storeWithSelection();
      expect(store.state.selectionImage.width).toBe(10);
      expect(store.state.selectionImage.height).toBe(10);
      expect(store.state.selectionOffset).toEqual({ w: 10, h: 10 });
      expect(isColor({ w: 2, h: 2 }, store.state.selectionImage, BLACK)).toBe(true);
      expect(pixel(store, 12, 12), 'the area is filled with the secondary color').toEqual(WHITE);
      expect(store.state.moveSelectionTool).toBeUndefined();
    });

    it('a mouse down inside the selection creates a MoveSelectionTool that drags the selection', () => {
      const store: TsPaintStore = storeWithSelection();
      store.processMouseDown(at(22, 22)); // 3px outside the selection pixels, still inside the grab border
      expect(store.state.moveSelectionTool).toBeInstanceOf(MoveSelectionTool);

      store.processMouseMove(at(32, 32));
      expect(store.state.selectionOffset).toEqual({ w: 20, h: 20 });
      expect(store.state.previewAction, 'the drawing tool does not get the move').toBeUndefined();

      store.processMouseUp(at(32, 32));
      expect(store.state.selectionOffset).toEqual({ w: 20, h: 20 });
      expect(store.state.selectionImage, 'the selection is still floating').toBeDefined();
      expect(pixel(store, 22, 22)).toEqual(WHITE);
    });

    it('reuses the same MoveSelectionTool for the next drag', () => {
      const store: TsPaintStore = storeWithSelection();
      store.processMouseDown(at(15, 15));
      store.processMouseUp(at(15, 15));
      const tool: MoveSelectionTool = store.state.moveSelectionTool;

      store.processMouseDown(at(15, 15));
      store.processMouseMove(at(16, 17));
      store.processMouseUp(at(16, 17));
      expect(store.state.moveSelectionTool).toBe(tool);
      expect(store.state.selectionOffset).toEqual({ w: 11, h: 12 });
    });

    it('a mouse down just outside the grab border deselects first and then forwards the event to the drawing tool', () => {
      const store: TsPaintStore = storeWithSelection();
      store.processMouseDown(at(23, 23));

      expect(store.state.selectionImage).toBeUndefined();
      expect(store.state.moveSelectionTool).toBeUndefined();
      expect(pixel(store, 12, 12), 'the selection was pasted back where it was').toEqual(BLACK);

      store.processMouseUp(at(30, 30));
      expect(store.state.selectionImage.width, 'the rectangle select tool got the mouse down').toBe(8);
      expect(store.state.selectionOffset).toEqual({ w: 23, h: 23 });
    });

    it('deselecting after a move pastes the selection at its new position', () => {
      const store: TsPaintStore = storeWithSelection();
      store.processMouseDown(at(15, 15));
      store.processMouseMove(at(25, 25));
      store.processMouseUp(at(25, 25));

      store.processMouseDown(at(60, 60));
      expect(pixel(store, 22, 22)).toEqual(BLACK);
      expect(pixel(store, 12, 12)).toEqual(WHITE);
    });

    it('routes mouse up and move to the selection tool only while a selection exists', () => {
      const store: TsPaintStore = storeWithSelection();
      store.processMouseDown(at(60, 60)); // deselects
      store.processMouseMove(at(65, 65));
      expect(store.state.previewAction, 'the rectangle select tool previews the new rectangle').toBeDefined();
    });
  });

  describe('setColor, setDrawingToolOptions, scroll position and viewport size', () => {
    it('setColor changes the primary or the secondary color and is undoable', () => {
      const store: TsPaintStore = createStore();
      store.setColor({ color: RED, primary: true });
      store.setColor({ color: BLUE, primary: false });
      expect(store.state.primaryColor).toEqual(RED);
      expect(store.state.secondaryColor).toEqual(BLUE);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.secondaryColor).toEqual(WHITE);
      expect(store.state.primaryColor).toEqual(RED);
    });

    it('setDrawingToolOptions merges the changed options into the existing ones', () => {
      const store: TsPaintStore = createStore();
      store.setDrawingToolOptions({ [DrawingToolType.line]: { thickness: 3 } });
      expect(store.state.drawingToolOptions[DrawingToolType.line].thickness).toBe(3);
      expect(store.state.drawingToolOptions[DrawingToolType.eraser].size).toBe(8);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.drawingToolOptions[DrawingToolType.line].thickness).toBe(1);
    });

    it('setScrollPosition and setViewportSize patch the state without touching the history', () => {
      const store: TsPaintStore = createStore();
      store.setScrollPosition({ w: 40, h: 20 });
      store.setViewportSize({ w: 800, h: 600 });
      expect(store.state.scrollPosition).toEqual({ w: 40, h: 20 });
      expect(store.state.viewportSize).toEqual({ w: 800, h: 600 });
      expect(store.state.actions).toEqual([]);
    });
  });

  describe('executeMenuAction', () => {
    let clipboardWrite: MockInstance;

    beforeEach(() => {
      clipboardWrite = vi.spyOn(navigator.clipboard, 'write').mockResolvedValue(undefined);
      vi.spyOn(window, 'alert').mockImplementation(() => undefined);
      removeFileSystemAccess();
    });

    afterEach(() => {
      restoreFileSystemAccess();
      vi.restoreAllMocks();
    });

    function storeWithSelection(): TsPaintStore {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
      selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });
      return store;
    }

    it('ignores an undefined action type', () => {
      const store: TsPaintStore = createStore();
      const stateBefore: TsPaintStoreState = store.state;
      expect(() => store.executeMenuAction(undefined)).not.toThrow();
      expect(store.state).toBe(stateBefore);
    });

    it('COPY writes the selection to the clipboard', async () => {
      const store: TsPaintStore = storeWithSelection();
      store.executeMenuAction(MenuActionType.COPY);
      await vi.waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));
      expect(store.state.selectionImage, 'copy keeps the selection').toBeDefined();
    });

    it('COPY does nothing without a selection', async () => {
      const store: TsPaintStore = createStore();
      store.executeMenuAction(MenuActionType.COPY);
      await settle();
      expect(clipboardWrite).not.toHaveBeenCalled();
    });

    it('CUT copies the selection and then removes it', async () => {
      const store: TsPaintStore = storeWithSelection();
      store.executeMenuAction(MenuActionType.CUT);
      await vi.waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));
      expect(store.state.selectionImage).toBeUndefined();
      expect(pixel(store, 12, 12), 'the cut area stays in the background color').toEqual(WHITE);
    });

    it('CLEAR_SELECTION removes the selection without pasting it and can be undone', () => {
      const store: TsPaintStore = storeWithSelection();
      store.executeMenuAction(MenuActionType.CLEAR_SELECTION);
      expect(store.state.selectionImage).toBeUndefined();
      expect(store.state.selectionOffset).toEqual({ w: 0, h: 0 });
      expect(pixel(store, 12, 12)).toEqual(WHITE);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.selectionImage.width).toBe(10);
      expect(store.state.selectionOffset).toEqual({ w: 10, h: 10 });
      expect(isColor({ w: 2, h: 2 }, store.state.selectionImage, BLACK)).toBe(true);
    });

    it('SELECT_ALL selects the whole image', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
      store.executeMenuAction(MenuActionType.SELECT_ALL);
      expect(store.state.selectionImage.width).toBe(100);
      expect(store.state.selectionImage.height).toBe(100);
      expect(store.state.selectionOffset).toEqual({ w: 0, h: 0 });
      expect(isColor({ w: 12, h: 12 }, store.state.selectionImage, BLACK)).toBe(true);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([]);
    });

    it('CLEAR_IMAGE fills the image with the secondary color and can be undone', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
      store.setColor({ color: BLUE, primary: false });
      store.executeMenuAction(MenuActionType.CLEAR_IMAGE);
      expect(pointsOfColor(store.state.image, BLUE).length).toBe(100 * 100);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(pixel(store, 12, 12)).toEqual(BLACK);
      expect(pixel(store, 0, 0)).toEqual(WHITE);
      expect(store.state.selectionImage).toBeUndefined();
    });

    it('CLEAR_IMAGE pastes a floating selection back before clearing it', () => {
      const store: TsPaintStore = storeWithSelection();
      store.executeMenuAction(MenuActionType.CLEAR_IMAGE);
      expect(store.state.selectionImage).toBeUndefined();
      expect(pointsOfColor(store.state.image, WHITE).length).toBe(100 * 100);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(pixel(store, 12, 12), 'undo brings back the image including the pasted selection').toEqual(BLACK);
    });

    it('CROP replaces the image with the selection and can be undone', () => {
      const store: TsPaintStore = storeWithSelection();
      store.executeMenuAction(MenuActionType.CROP);
      expect(store.state.image.width).toBe(10);
      expect(store.state.image.height).toBe(10);
      expect(pixel(store, 2, 2)).toEqual(BLACK);
      expect(store.state.selectionImage).toBeUndefined();

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.image.width).toBe(100);
      expect(store.state.selectionImage.width).toBe(10);
      expect(store.state.selectionOffset).toEqual({ w: 10, h: 10 });
    });

    it('CROP does nothing without a selection', () => {
      const store: TsPaintStore = createStore();
      store.executeMenuAction(MenuActionType.CROP);
      expect(store.state.image.width).toBe(100);
      expect(store.state.actions).toEqual([]);
    });

    it('INVERT_COLORS inverts the image, or only the selection when there is one', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
      store.executeMenuAction(MenuActionType.INVERT_COLORS);
      expect(pixel(store, 12, 12)).toEqual(WHITE);
      expect(pixel(store, 0, 0)).toEqual(BLACK);
      expect(pointsOfColor(store.state.image, WHITE)).toEqual([{ w: 12, h: 12 }]);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(pixel(store, 0, 0)).toEqual(WHITE);

      selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });
      store.executeMenuAction(MenuActionType.INVERT_COLORS);
      expect(isColor({ w: 2, h: 2 }, store.state.selectionImage, WHITE)).toBe(true);
      expect(isColor({ w: 0, h: 0 }, store.state.selectionImage, BLACK)).toBe(true);
      expect(pixel(store, 0, 0), 'the image itself is untouched').toEqual(WHITE);
    });

    it('DESELECT pastes the selection back, and does nothing without a selection', () => {
      const store: TsPaintStore = storeWithSelection();
      const actionCount: number = store.state.actions.length;
      store.executeMenuAction(MenuActionType.DESELECT);
      expect(store.state.selectionImage).toBeUndefined();
      expect(pixel(store, 12, 12)).toEqual(BLACK);
      expect(store.state.actions.length).toBe(actionCount + 1);

      store.executeMenuAction(MenuActionType.DESELECT);
      expect(store.state.actions.length).toBe(actionCount + 1);
    });

    it('opens the Flip/Rotate, Stretch/Skew, Attributes and About windows', () => {
      const store: TsPaintStore = createStore();
      store.executeMenuAction(MenuActionType.FLIP_IMAGE);
      store.executeMenuAction(MenuActionType.STRETCH_SKEW);
      store.executeMenuAction(MenuActionType.OPEN_ATTRIBUTES_WINDOW);
      store.executeMenuAction(MenuActionType.ABOUT_PAINT);
      expect(store.state.flipRotateWindowOpen).toBe(true);
      expect(store.state.stretchSkewWindowOpen).toBe(true);
      expect(store.state.attributesWindowOpen).toBe(true);
      expect(store.state.aboutPaintWindowOpen).toBe(true);
      expect(store.state.saveAsWindowOpen).toBe(false);
    });

    it('SAVE_AS opens the Save As window when the File System Access API is not available', () => {
      const store: TsPaintStore = createStore();
      store.executeMenuAction(MenuActionType.SAVE_AS);
      expect(store.state.saveAsWindowOpen).toBe(true);
    });
  });

  describe('file operations', () => {
    let downloads: string[];
    let inputClicks: string[];
    let confirmSpy: MockInstance;
    let pickers: FileSystemAccessStubs;
    let redImage: ImageData;

    beforeEach(() => {
      downloads = [];
      inputClicks = [];
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push(this.download);
      });
      vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
        inputClicks.push(this.type);
      });
      confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      pickers = stubFileSystemAccess();
      redImage = createImage(7, 5, RED);
    });

    afterEach(() => {
      restoreFileSystemAccess();
      vi.restoreAllMocks();
    });

    async function createFileHandle(fileName: string, mimeType: string = 'image/png'): Promise<FakeFileHandle> {
      return new FakeFileHandle(fileName, 'file', await createImageFile(redImage, fileName, mimeType));
    }

    function expectRedImageLoaded(store: TsPaintStore): void {
      expect(store.state.image.width).toBe(7);
      expect(store.state.image.height).toBe(5);
      expect(pointsOfColor(store.state.image, RED).length).toBe(35);
    }

    describe('OPEN_FILE', () => {
      it('opens the picked file and keeps its handle with the File System Access API', async () => {
        const store: TsPaintStore = createStore();
        const handle: FakeFileHandle = await createFileHandle('photo.png');
        pickers.showOpenFilePicker.mockResolvedValue([handle]);

        store.executeMenuAction(MenuActionType.OPEN_FILE);
        await vi.waitFor(() => expect(store.state.fileName).toBe('photo'));

        expectRedImageLoaded(store);
        expect(store.state.fileFormat).toBe('png');
        expect(store.state.fileHandle).toBe(handle.asHandle());
        expect(store.state.unsavedChanges).toBe(false);
        expect(store.state.actions[store.state.actions.length - 1]).toBeInstanceOf(OpenFileAction);
        expect(confirmSpy).not.toHaveBeenCalled();
      });

      it('swallows a cancelled picker', async () => {
        const store: TsPaintStore = createStore();
        pickers.showOpenFilePicker.mockRejectedValue(createAbortError());

        store.executeMenuAction(MenuActionType.OPEN_FILE);
        await settle();

        expect(pickers.showOpenFilePicker).toHaveBeenCalledTimes(1);
        expect(store.state.fileName).toBe('untitled');
        expect(store.state.actions).toEqual([]);
      });

      it('falls back to a file input without the File System Access API', async () => {
        removeFileSystemAccess();
        const store: TsPaintStore = createStore();

        store.executeMenuAction(MenuActionType.OPEN_FILE);
        await settle();

        expect(inputClicks).toEqual(['file']);
      });

      it('asks to save unsaved changes first and saves them when the user agrees', async () => {
        removeFileSystemAccess();
        const store: TsPaintStore = createStore({ unsavedChanges: true });
        confirmSpy.mockReturnValue(true);

        store.executeMenuAction(MenuActionType.OPEN_FILE);
        await settle();

        expect(confirmSpy).toHaveBeenCalledWith('Save changes to untitled?');
        expect(downloads).toEqual(['untitled.png']);
        expect(inputClicks).toEqual(['file']);
      });

      it('does not save when the user declines', async () => {
        removeFileSystemAccess();
        const store: TsPaintStore = createStore({ unsavedChanges: true });

        store.executeMenuAction(MenuActionType.OPEN_FILE);
        await settle();

        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(downloads).toEqual([]);
        expect(inputClicks).toEqual(['file']);
      });
    });

    describe('SAVE_FILE', () => {
      it('downloads the image without the File System Access API', async () => {
        removeFileSystemAccess();
        const store: TsPaintStore = createStore({ unsavedChanges: true });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await settle();

        expect(downloads).toEqual(['untitled.png']);
        expect(store.state.unsavedChanges).toBe(false);
      });

      it('downloads with the extension of the current format', async () => {
        removeFileSystemAccess();
        const store: TsPaintStore = createStore({ fileName: 'pic', fileFormat: 'jpeg' });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await settle();

        expect(downloads).toEqual(['pic.jpg']);
      });

      it('writes to the existing file handle without asking for a location', async () => {
        const handle: FakeFileHandle = new FakeFileHandle('photo.png');
        const store: TsPaintStore = createStore({ fileHandle: handle.asHandle(), unsavedChanges: true });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await vi.waitFor(() => expect(handle.writable.close).toHaveBeenCalledTimes(1));

        expect(handle.writable.write).toHaveBeenCalledTimes(1);
        expect((handle.writable.write.mock.calls[0][0] as Blob).type).toBe('image/png');
        expect(pickers.showSaveFilePicker).not.toHaveBeenCalled();
        expect(store.state.unsavedChanges).toBe(false);
        expect(downloads).toEqual([]);
      });

      it('shows the save picker when there is no handle yet and remembers the chosen file', async () => {
        const handle: FakeFileHandle = new FakeFileHandle('drawing.jpg');
        pickers.showSaveFilePicker.mockResolvedValue(handle);
        const store: TsPaintStore = createStore({ unsavedChanges: true });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await vi.waitFor(() => expect(handle.writable.close).toHaveBeenCalledTimes(1));

        expect(pickers.showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(pickers.showSaveFilePicker.mock.calls[0][0]).toEqual(
          expect.objectContaining({ suggestedName: 'untitled.png', excludeAcceptAllOption: true })
        );
        expect(store.state.fileName).toBe('drawing');
        expect(store.state.fileFormat).toBe('jpeg');
        expect(store.state.fileHandle).toBe(handle.asHandle());
        expect((handle.writable.write.mock.calls[0][0] as Blob).type).toBe('image/jpeg');
        expect(store.state.unsavedChanges).toBe(false);
      });

      it('swallows a cancelled save picker and keeps the unsaved changes', async () => {
        pickers.showSaveFilePicker.mockRejectedValue(createAbortError());
        const store: TsPaintStore = createStore({ unsavedChanges: true });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await settle();

        expect(store.state.unsavedChanges).toBe(true);
        expect(store.state.fileHandle).toBeUndefined();
        expect(downloads).toEqual([]);
      });

      it('falls back to a download when writing to the handle fails', async () => {
        const handle: FakeFileHandle = new FakeFileHandle('photo.png');
        handle.createWritableError = new DOMException('Permission denied', 'NotAllowedError');
        const store: TsPaintStore = createStore({
          fileHandle: handle.asHandle(),
          fileName: 'photo',
          unsavedChanges: true,
        });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await vi.waitFor(() => expect(downloads).toEqual(['photo.png']));

        expect(store.state.unsavedChanges).toBe(false);
      });

      it('keeps the unsaved changes when the write is aborted', async () => {
        const handle: FakeFileHandle = new FakeFileHandle('photo.png');
        handle.createWritableError = createAbortError();
        const store: TsPaintStore = createStore({ fileHandle: handle.asHandle(), unsavedChanges: true });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await settle();

        expect(downloads).toEqual([]);
        expect(store.state.unsavedChanges).toBe(true);
      });

      it('pastes a floating selection into the image before saving', async () => {
        removeFileSystemAccess();
        const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
        selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });

        store.executeMenuAction(MenuActionType.SAVE_FILE);
        await settle();

        expect(store.state.selectionImage).toBeUndefined();
        expect(pixel(store, 12, 12)).toEqual(BLACK);
        expect(downloads).toEqual(['untitled.png']);
      });
    });

    describe('SAVE_AS', () => {
      it('always shows the save picker, even when a handle exists', async () => {
        const oldHandle: FakeFileHandle = new FakeFileHandle('old.png');
        const newHandle: FakeFileHandle = new FakeFileHandle('new.png');
        pickers.showSaveFilePicker.mockResolvedValue(newHandle);
        const store: TsPaintStore = createStore({ fileHandle: oldHandle.asHandle(), fileName: 'old' });

        store.executeMenuAction(MenuActionType.SAVE_AS);
        await vi.waitFor(() => expect(newHandle.writable.close).toHaveBeenCalledTimes(1));

        expect(pickers.showSaveFilePicker.mock.calls[0][0]).toEqual(
          expect.objectContaining({ suggestedName: 'old.png' })
        );
        expect(store.state.fileName).toBe('new');
        expect(store.state.fileHandle).toBe(newHandle.asHandle());
        expect(oldHandle.writable.write).not.toHaveBeenCalled();
      });
    });

    describe('saveFileFromSaveAsWindow', () => {
      it('closes the window, stores the name and format, drops the handle and downloads', () => {
        const handle: FakeFileHandle = new FakeFileHandle('old.png');
        const store: TsPaintStore = createStore({
          saveAsWindowOpen: true,
          fileHandle: handle.asHandle(),
          unsavedChanges: true,
          image: imageWithBlackPixel(),
        });
        selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });

        store.saveFileFromSaveAsWindow({ fileName: 'pic', format: 'jpeg' });

        expect(store.state.saveAsWindowOpen).toBe(false);
        expect(store.state.fileName).toBe('pic');
        expect(store.state.fileFormat).toBe('jpeg');
        expect(store.state.fileHandle).toBeUndefined();
        expect(downloads).toEqual(['pic.jpg']);
        expect(store.state.unsavedChanges).toBe(false);
        expect(store.state.selectionImage, 'the selection is pasted before saving').toBeUndefined();
        expect(pixel(store, 12, 12)).toEqual(BLACK);
      });
    });

    describe('loadFile', () => {
      it('opens the file and keeps the handle for a writable image format', async () => {
        const store: TsPaintStore = createStore();
        const handle: FakeFileHandle = await createFileHandle('photo.png');

        await store.loadFile(await handle.getFile(), Promise.resolve(handle.asHandle()));

        expectRedImageLoaded(store);
        expect(store.state.fileName).toBe('photo');
        expect(store.state.fileFormat).toBe('png');
        expect(store.state.fileHandle).toBe(handle.asHandle());
        expect(store.state.unsavedChanges).toBe(false);
      });

      it('derives the format from the extension', async () => {
        const store: TsPaintStore = createStore();
        const handle: FakeFileHandle = await createFileHandle('scan.JPEG', 'image/jpeg');

        await store.loadFile(await handle.getFile(), Promise.resolve(handle.asHandle()));

        expect(store.state.fileName).toBe('scan');
        expect(store.state.fileFormat).toBe('jpeg');
        expect(store.state.fileHandle).toBe(handle.asHandle());
      });

      it('drops the handle for a read-only format, falling back to the default format', async () => {
        const store: TsPaintStore = createStore();
        const handle: FakeFileHandle = await createFileHandle('anim.gif', 'image/gif');

        await store.loadFile(await handle.getFile(), Promise.resolve(handle.asHandle()));

        expectRedImageLoaded(store);
        expect(store.state.fileName).toBe('anim');
        expect(store.state.fileFormat).toBe('png');
        expect(store.state.fileHandle).toBeUndefined();
      });

      it('drops a handle that is not a file handle', async () => {
        const store: TsPaintStore = createStore();
        const handle: FakeFileHandle = new FakeFileHandle('photo.png', 'directory');

        await store.loadFile(await createImageFile(redImage, 'photo.png'), Promise.resolve(handle.asHandle()));

        expect(store.state.fileHandle).toBeUndefined();
        expectRedImageLoaded(store);
      });

      it('works without a handle, and replaces an existing handle and selection', async () => {
        const oldHandle: FakeFileHandle = new FakeFileHandle('old.png');
        const store: TsPaintStore = createStore({ fileHandle: oldHandle.asHandle(), image: imageWithBlackPixel() });
        selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });

        await store.loadFile(await createImageFile(redImage, 'photo.png'));

        expect(store.state.fileHandle).toBeUndefined();
        expect(store.state.selectionImage).toBeUndefined();
        expectRedImageLoaded(store);
      });

      it('asks to save unsaved changes before replacing the image', async () => {
        const store: TsPaintStore = createStore({ unsavedChanges: true, fileName: 'sketch' });

        await store.loadFile(await createImageFile(redImage, 'photo.png'));

        expect(confirmSpy).toHaveBeenCalledWith('Save changes to sketch?');
        expectRedImageLoaded(store);
      });
    });

    describe('loadFileFromUrl', () => {
      it('loads the image and derives the name and format from the last URL segment', async () => {
        const store: TsPaintStore = createStore();

        await store.loadFileFromUrl(createImageDataUrl(redImage) + '#/photos/holiday.jpeg');

        expectRedImageLoaded(store);
        expect(store.state.fileName).toBe('holiday');
        expect(store.state.fileFormat).toBe('jpeg');
        expect(store.state.fileHandle).toBeUndefined();
        expect(store.state.unsavedChanges).toBe(false);
      });

      it('uses the default format when the last segment has no known extension', async () => {
        const store: TsPaintStore = createStore();

        await store.loadFileFromUrl(createImageDataUrl(redImage) + '#/scan');

        expect(store.state.fileName).toBe('scan');
        expect(store.state.fileFormat).toBe('png');
      });

      it('asks to save unsaved changes first', async () => {
        const store: TsPaintStore = createStore({ unsavedChanges: true });

        await store.loadFileFromUrl(createImageDataUrl(redImage) + '#/scan.png');

        expect(confirmSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('pasteFile', () => {
      it('pastes the image as a selection at the visible top left corner and switches to the select tool', async () => {
        const store: TsPaintStore = createStore({ zoom: 2, scrollPosition: { w: 40, h: 20 } });

        store.pasteFile(await createImageFile(redImage, 'clip.png'));
        await vi.waitFor(() => expect(store.state.selectionImage).toBeDefined());

        expect(store.state.selectedDrawingTool.type).toBe(DrawingToolType.rectangleSelect);
        expect(store.state.selectionImage.width).toBe(7);
        expect(store.state.selectionImage.height).toBe(5);
        expect(store.state.selectionOffset).toEqual({ w: 20, h: 10 });
        expect(store.state.image.width, 'the image keeps its size').toBe(100);
        expect(store.state.previewImage.width).toBe(1);
      });

      it('grows the image when the pasted image is larger', async () => {
        const store: TsPaintStore = createStore();

        store.pasteFile(await createImageFile(createImage(120, 30, RED), 'big.png'));
        await vi.waitFor(() => expect(store.state.selectionImage).toBeDefined());

        expect(store.state.image.width).toBe(120);
        expect(store.state.image.height).toBe(100);
      });

      it('ignores a null file', async () => {
        const store: TsPaintStore = createStore();
        store.pasteFile(null);
        await settle();
        expect(store.state.selectionImage).toBeUndefined();
        expect(store.state.actions).toEqual([]);
      });
    });
  });

  describe('dialog windows', () => {
    it('stretchSkew closes the window and stretches the image', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel(), stretchSkewWindowOpen: true });
      store.stretchSkew({ stretch: { horizontal: 200 } });

      expect(store.state.stretchSkewWindowOpen).toBe(false);
      expect(store.state.image.width).toBe(200);
      expect(store.state.image.height).toBe(100);
      expect(pixel(store, 24, 12)).toEqual(BLACK);
      expect(pixel(store, 25, 12)).toEqual(BLACK);
      expect(pixel(store, 26, 12)).toEqual(WHITE);
    });

    it('stretchSkew with only skew parameters closes the window and leaves the image alone (skew is not implemented)', () => {
      const store: TsPaintStore = createStore({ stretchSkewWindowOpen: true });
      expect(() => store.stretchSkew({ skew: { horizontal: 10 } })).not.toThrow();
      expect(store.state.stretchSkewWindowOpen).toBe(false);
      expect(store.state.image.width).toBe(100);
      expect(store.state.actions).toEqual([]);
    });

    it('flipRotate flips the image', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel(), flipRotateWindowOpen: true });
      store.flipRotate({ flip: 'horizontal' });
      expect(store.state.flipRotateWindowOpen).toBe(false);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([{ w: 87, h: 12 }]);

      store.flipRotate({ flip: 'vertical' });
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([{ w: 87, h: 87 }]);
    });

    it('flipRotate rotates the image', () => {
      const image: ImageData = createImage(100, 50, WHITE);
      setPixel(image, { w: 0, h: 0 }, BLACK);
      const store: TsPaintStore = createStore({ image });

      store.flipRotate({ rotate: 90 });
      expect(store.state.image.width).toBe(50);
      expect(store.state.image.height).toBe(100);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([{ w: 49, h: 0 }]);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.image.width).toBe(100);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([{ w: 0, h: 0 }]);
    });

    it('flipRotate without parameters closes the window and does nothing else', () => {
      const store: TsPaintStore = createStore({ flipRotateWindowOpen: true });
      expect(() => store.flipRotate({})).not.toThrow();
      expect(store.state.flipRotateWindowOpen).toBe(false);
      expect(store.state.actions).toEqual([]);
    });

    it('changeAttributes closes the window and resizes the image, filling new space with the secondary color', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel(), attributesWindowOpen: true });
      store.setColor({ color: BLUE, primary: false });

      store.changeAttributes({ w: 150, h: 80 });

      expect(store.state.attributesWindowOpen).toBe(false);
      expect(store.state.image.width).toBe(150);
      expect(store.state.image.height).toBe(80);
      expect(pixel(store, 12, 12)).toEqual(BLACK);
      expect(pixel(store, 120, 10)).toEqual(BLUE);

      store.executeMenuAction(MenuActionType.UNDO);
      expect(store.state.image.width).toBe(100);
      expect(store.state.image.height).toBe(100);
    });

    it('the close methods clear the window flags', () => {
      const store: TsPaintStore = createStore({
        stretchSkewWindowOpen: true,
        flipRotateWindowOpen: true,
        attributesWindowOpen: true,
        saveAsWindowOpen: true,
        aboutPaintWindowOpen: true,
      });

      store.closeStretchSkewWindow();
      expect(store.state.stretchSkewWindowOpen).toBe(false);
      store.closeFlipRotateWindow();
      expect(store.state.flipRotateWindowOpen).toBe(false);
      store.closeAttributesWindow();
      expect(store.state.attributesWindowOpen).toBe(false);
      store.closeSaveAsWindow();
      expect(store.state.saveAsWindowOpen).toBe(false);
      store.closeAboutPaintWindow();
      expect(store.state.aboutPaintWindowOpen).toBe(false);
      expect(store.state.actions, 'closing windows is not part of the history').toEqual([]);
    });
  });

  describe('executeHotkeyAction', () => {
    function storeWithStroke(): TsPaintStore {
      const store: TsPaintStore = createStore();
      store.setDrawingTool(DrawingToolType.pencil);
      stroke(store, { w: 2, h: 2 }, { w: 5, h: 2 });
      return store;
    }

    it('runs the matching menu action and returns true', () => {
      const store: TsPaintStore = storeWithStroke();
      expect(store.executeHotkeyAction(keyEvent({ key: 'z', ctrlKey: true }))).toBe(true);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([]);

      expect(store.executeHotkeyAction(keyEvent({ key: 'Y', ctrlKey: true }))).toBe(true);
      expect(pointsOfColor(store.state.image, BLACK).length).toBe(4);
    });

    it('accepts the meta key in place of ctrl', () => {
      const store: TsPaintStore = storeWithStroke();
      expect(store.executeHotkeyAction(keyEvent({ key: 'z', metaKey: true }))).toBe(true);
      expect(pointsOfColor(store.state.image, BLACK)).toEqual([]);
    });

    it('returns false and does nothing for a key combination without a menu action', () => {
      const store: TsPaintStore = storeWithStroke();
      const stateBefore: TsPaintStoreState = store.state;
      expect(store.executeHotkeyAction(keyEvent({ key: 'q', ctrlKey: true }))).toBe(false);
      expect(store.executeHotkeyAction(keyEvent({ key: 'z' }))).toBe(false);
      expect(store.executeHotkeyAction(keyEvent({ key: 'z', ctrlKey: true, shiftKey: true }))).toBe(false);
      expect(store.state).toBe(stateBefore);
    });

    it('finds the hidden shortcuts that are not in the menu', () => {
      const store: TsPaintStore = createStore({ image: imageWithBlackPixel() });
      selectArea(store, { w: 10, h: 10 }, { w: 19, h: 19 });

      expect(store.executeHotkeyAction(keyEvent({ key: 'Escape' }))).toBe(true);
      expect(store.state.selectionImage).toBeUndefined();
      expect(pixel(store, 12, 12)).toEqual(BLACK);
    });
  });
});
