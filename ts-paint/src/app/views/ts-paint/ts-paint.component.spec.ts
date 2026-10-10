import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi, Mock } from 'vitest';
import { TsPaintComponent } from './ts-paint.component';
import { AppModule } from '../../app.module';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import {
  createFileHandleStub,
  createTestFile,
  dragEvent,
  dropEventWithFile,
  keydown,
  pasteEventWithFile,
  recordEvents,
  EventRecorder,
} from '../../../testing/events';

describe('TsPaintComponent', () => {
  let fixture: ComponentFixture<TsPaintComponent>;
  let store: TsPaintStore;
  let queryParams: BehaviorSubject<Params>;
  let setConsumer: Mock<(consumer: (params: LaunchParams) => void) => void>;
  let originalLaunchQueue: PropertyDescriptor | undefined;
  let reachedDocument: EventRecorder;

  beforeEach(async () => {
    queryParams = new BehaviorSubject<Params>({});
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: ActivatedRoute, useValue: { queryParams } }],
    }).compileComponents();
    store = TestBed.inject(TsPaintStore);
    // Chromium has a real launchQueue; a stub keeps the registered consumer reachable and the tests deterministic
    originalLaunchQueue = Object.getOwnPropertyDescriptor(window, 'launchQueue');
    setConsumer = vi.fn();
    installLaunchQueue({ setConsumer });
  });

  afterEach(() => {
    if (originalLaunchQueue) {
      Object.defineProperty(window, 'launchQueue', originalLaunchQueue);
    } else {
      delete (window as { launchQueue?: LaunchQueue }).launchQueue;
    }
    vi.restoreAllMocks();
    reachedDocument?.stop();
  });

  function installLaunchQueue(launchQueue: LaunchQueue | undefined) {
    Object.defineProperty(window, 'launchQueue', { value: launchQueue, configurable: true, writable: true });
  }

  function createComponent(): TsPaintComponent {
    fixture = TestBed.createComponent(TsPaintComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function host(): HTMLElement {
    return fixture.nativeElement;
  }

  function openWindow(flag: keyof TsPaintStoreState) {
    store.patchState(true, flag);
    fixture.detectChanges();
  }

  function dialogButton(dialogSelector: string, label: string): HTMLButtonElement {
    const dialog: HTMLElement = host().querySelector(dialogSelector);
    return Array.from<HTMLButtonElement>(dialog.querySelectorAll('button.tsp-text-button')).find(
      (button) => button.textContent.trim() === label
    );
  }

  it('renders the toolbox, palette and canvas', () => {
    createComponent();
    expect(host().querySelector('tsp-toolbox')).not.toBeNull();
    expect(host().querySelector('tsp-palette')).not.toBeNull();
    expect(host().querySelector('tsp-zoomable-canvas canvas')).not.toBeNull();
    expect(host().querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe('untitled - Paint');
  });

  it('selects the line tool on startup', () => {
    createComponent();
    expect(store.state.selectedDrawingTool.type).toBe(DrawingToolType.line);
  });

  describe('imageUrl query parameter', () => {
    it('loads the image from the URL', () => {
      const loadFileFromUrl: Mock = vi.spyOn(store, 'loadFileFromUrl').mockResolvedValue(undefined);
      queryParams.next({ imageUrl: 'https://example.com/images/picture.png' });
      createComponent();
      expect(loadFileFromUrl).toHaveBeenCalledWith('https://example.com/images/picture.png');
    });

    it('loads nothing without the parameter', () => {
      const loadFileFromUrl: Mock = vi.spyOn(store, 'loadFileFromUrl').mockResolvedValue(undefined);
      queryParams.next({ other: 'value' });
      createComponent();
      expect(loadFileFromUrl).not.toHaveBeenCalled();
    });
  });

  describe('launch queue (files opened with the installed app)', () => {
    function registeredConsumer(): (params: LaunchParams) => void {
      expect(setConsumer).toHaveBeenCalledTimes(1);
      return setConsumer.mock.calls[0][0];
    }

    it('registers a consumer when the launch queue exists', () => {
      createComponent();
      expect(setConsumer).toHaveBeenCalledTimes(1);
    });

    it('loads a launched file together with its handle', async () => {
      const loadFile: Mock = vi.spyOn(store, 'loadFile').mockResolvedValue(undefined);
      const file: File = createTestFile('launched.png');
      const handle: FileSystemFileHandle = createFileHandleStub(file);
      createComponent();
      await registeredConsumer()({ files: [handle] });
      expect(loadFile).toHaveBeenCalledTimes(1);
      expect(loadFile.mock.calls[0][0]).toBe(file);
      await expect(loadFile.mock.calls[0][1]).resolves.toBe(handle);
    });

    it('ignores launches without a file handle', async () => {
      const loadFile: Mock = vi.spyOn(store, 'loadFile').mockResolvedValue(undefined);
      createComponent();
      const consumer: (params: LaunchParams) => void = registeredConsumer();
      await consumer({ files: [] });
      await consumer({ files: [{ kind: 'directory', name: 'folder' } as FileSystemHandle] });
      expect(loadFile).not.toHaveBeenCalled();
    });

    it('works without a launch queue (other browsers)', () => {
      installLaunchQueue(undefined);
      expect(() => createComponent()).not.toThrow();
    });
  });

  it('pastes a file from the clipboard', () => {
    const pasteFile: Mock = vi.spyOn(store, 'pasteFile').mockImplementation(() => undefined);
    createComponent();
    const file: File = createTestFile('pasted.png');
    document.dispatchEvent(pasteEventWithFile(file));
    expect(pasteFile).toHaveBeenCalledTimes(1);
    const pasted: File = pasteFile.mock.calls[0][0];
    expect(pasted.name).toBe('pasted.png');
    expect(pasted.type).toBe('image/png');
  });

  it('prevents the default dragover handling so that drop events arrive', () => {
    createComponent();
    reachedDocument = recordEvents(document, 'dragover');
    const event: DragEvent = dragEvent('dragover');
    host().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(reachedDocument.events.length, 'propagation is stopped').toBe(0);
  });

  describe('dropping a file', () => {
    let loadFile: Mock;
    const file: File = createTestFile('dropped.png');

    beforeEach(() => {
      loadFile = vi.spyOn(store, 'loadFile').mockResolvedValue(undefined);
      createComponent();
    });

    it('loads the file with its file system handle', async () => {
      const handle: FileSystemFileHandle = createFileHandleStub(file);
      reachedDocument = recordEvents(document, 'drop');
      const event: DragEvent = dropEventWithFile(file, handle);
      host().dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(reachedDocument.events.length, 'propagation is stopped').toBe(0);
      expect(loadFile).toHaveBeenCalledTimes(1);
      expect(loadFile.mock.calls[0][0]).toBe(file);
      await expect(loadFile.mock.calls[0][1]).resolves.toBe(handle);
    });

    it('passes a null handle when the browser cannot provide one', async () => {
      host().dispatchEvent(dropEventWithFile(file));
      expect(loadFile.mock.calls[0][0]).toBe(file);
      await expect(loadFile.mock.calls[0][1]).resolves.toBeNull();
    });

    it('passes a null handle when requesting it fails', async () => {
      host().dispatchEvent(dropEventWithFile(file, Promise.reject(new Error('not allowed'))));
      await expect(loadFile.mock.calls[0][1]).resolves.toBeNull();
    });
  });

  describe('hotkeys', () => {
    it('consumes a keydown that executed a hotkey action', () => {
      const executeHotkeyAction: Mock = vi.spyOn(store, 'executeHotkeyAction').mockReturnValue(true);
      createComponent();
      const event: KeyboardEvent = keydown('z', { ctrl: true });
      window.dispatchEvent(event);
      expect(executeHotkeyAction).toHaveBeenCalledWith(event);
      expect(event.defaultPrevented).toBe(true);
      expect(event.cancelBubble).toBe(true);
    });

    it('leaves a keydown alone when no hotkey action matched', () => {
      const executeHotkeyAction: Mock = vi.spyOn(store, 'executeHotkeyAction').mockReturnValue(false);
      createComponent();
      const event: KeyboardEvent = keydown('q');
      window.dispatchEvent(event);
      expect(executeHotkeyAction).toHaveBeenCalledWith(event);
      expect(event.defaultPrevented).toBe(false);
      expect(event.cancelBubble).toBe(false);
    });
  });

  describe('beforeunload', () => {
    it('is wired to the window event', () => {
      const component: TsPaintComponent = createComponent();
      const beforeunload: Mock = vi.spyOn(component, 'beforeunload');
      window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
      expect(beforeunload).toHaveBeenCalledTimes(1);
    });

    it('asks for confirmation only when there are unsaved changes', () => {
      const component: TsPaintComponent = createComponent();
      const untouched: { returnValue?: boolean } = {};
      component.beforeunload(untouched);
      expect('returnValue' in untouched).toBe(false);

      store.patchState(true, 'unsavedChanges');
      const dirty: { returnValue?: boolean } = {};
      component.beforeunload(dirty);
      expect(dirty.returnValue).toBe(true);
    });
  });

  describe('dialogs', () => {
    const DIALOG_SELECTORS: string[] = [
      'tsp-attributes-window',
      'tsp-save-as-window',
      'tsp-flip-rotate-window',
      'tsp-stretch-skew-window',
      'tsp-about-paint-window',
    ];

    it('are all closed initially', () => {
      createComponent();
      DIALOG_SELECTORS.forEach((selector) => expect(host().querySelector(selector), selector).toBeNull());
    });

    it('Attributes: opens with the image dimensions and calls the store on OK / Cancel', () => {
      const changeAttributes: Mock = vi.spyOn(store, 'changeAttributes').mockImplementation(() => undefined);
      const closeAttributesWindow: Mock = vi.spyOn(store, 'closeAttributesWindow');
      createComponent();
      openWindow('attributesWindowOpen');
      expect(host().querySelector('tsp-attributes-window')).not.toBeNull();
      dialogButton('tsp-attributes-window', 'OK').click();
      expect(changeAttributes).toHaveBeenCalledWith({ w: store.state.image.width, h: store.state.image.height });
      dialogButton('tsp-attributes-window', 'Cancel').click();
      expect(closeAttributesWindow).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(host().querySelector('tsp-attributes-window')).toBeNull();
    });

    it('Save As: opens with the current name and format and calls the store on Save / Cancel', () => {
      const saveFileFromSaveAsWindow: Mock = vi
        .spyOn(store, 'saveFileFromSaveAsWindow')
        .mockImplementation(() => undefined);
      const closeSaveAsWindow: Mock = vi.spyOn(store, 'closeSaveAsWindow');
      createComponent();
      openWindow('saveAsWindowOpen');
      const dialog: HTMLElement = host().querySelector('tsp-save-as-window');
      expect(dialog).not.toBeNull();
      expect(dialog.querySelector<HTMLInputElement>('tsp-text-input input').value).toBe('untitled');
      expect(dialog.querySelector('.tsp-dropdown__input').textContent.trim()).toBe('PNG');
      dialogButton('tsp-save-as-window', 'Save').click();
      expect(saveFileFromSaveAsWindow).toHaveBeenCalledWith({ fileName: 'untitled', format: 'png' });
      dialogButton('tsp-save-as-window', 'Cancel').click();
      expect(closeSaveAsWindow).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(host().querySelector('tsp-save-as-window')).toBeNull();
    });

    it('Flip and Rotate: calls the store on OK / Cancel', () => {
      const flipRotate: Mock = vi.spyOn(store, 'flipRotate').mockImplementation(() => undefined);
      const closeFlipRotateWindow: Mock = vi.spyOn(store, 'closeFlipRotateWindow');
      createComponent();
      openWindow('flipRotateWindowOpen');
      expect(host().querySelector('tsp-flip-rotate-window')).not.toBeNull();
      dialogButton('tsp-flip-rotate-window', 'OK').click();
      expect(flipRotate).toHaveBeenCalledWith({ flip: 'horizontal' });
      dialogButton('tsp-flip-rotate-window', 'Cancel').click();
      expect(closeFlipRotateWindow).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(host().querySelector('tsp-flip-rotate-window')).toBeNull();
    });

    it('Stretch and Skew: calls the store on OK / Cancel', () => {
      const stretchSkew: Mock = vi.spyOn(store, 'stretchSkew').mockImplementation(() => undefined);
      const closeStretchSkewWindow: Mock = vi.spyOn(store, 'closeStretchSkewWindow');
      createComponent();
      openWindow('stretchSkewWindowOpen');
      expect(host().querySelector('tsp-stretch-skew-window')).not.toBeNull();
      dialogButton('tsp-stretch-skew-window', 'OK').click();
      expect(stretchSkew).toHaveBeenCalledWith({ stretch: { horizontal: 100, vertical: 100 } });
      dialogButton('tsp-stretch-skew-window', 'Cancel').click();
      expect(closeStretchSkewWindow).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(host().querySelector('tsp-stretch-skew-window')).toBeNull();
    });

    it('About Paint: closes through the store on OK', () => {
      const closeAboutPaintWindow: Mock = vi.spyOn(store, 'closeAboutPaintWindow');
      createComponent();
      openWindow('aboutPaintWindowOpen');
      expect(host().querySelector('tsp-about-paint-window')).not.toBeNull();
      dialogButton('tsp-about-paint-window', 'OK').click();
      expect(closeAboutPaintWindow).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(host().querySelector('tsp-about-paint-window')).toBeNull();
    });
  });
});
