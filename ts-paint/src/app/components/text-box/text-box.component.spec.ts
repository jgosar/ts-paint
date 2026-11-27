import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextBoxComponent } from './text-box.component';
import { SelectionFrameComponent } from '../selection-frame/selection-frame.component';
import { DragDirective } from '../../directives/drag.directive';
import { TextOptions } from '../../types/drawing-tools/drawing-tool-options';
import { TextBox } from '../../types/base/text-box';
import { RectangleArea } from '../../types/base/rectangle-area';
import { createImage } from '../../helpers/image.helpers';
import { getFontMetrics } from '../../helpers/text.helpers';
import { alphaAt, BLACK, isColor, pointsOfColor, RED, WHITE } from '../../../testing/image-test.helpers';
import { keydown, pasteEventWithText, recordEvents, EventRecorder } from '../../../testing/events';
import { usePageZoom } from '../../../testing/page-zoom.helpers';

const OPTIONS: TextOptions = { fontFamily: 'monospace', fontSize: 12, bold: false, italic: false, underline: false };
/** 60x30 at (10,20) */
const BOX: TextBox = { area: { start: { w: 10, h: 20 }, end: { w: 69, h: 49 } }, text: 'Hi' };

function pointer(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 3, bubbles: true, cancelable: true });
}

describe('TextBoxComponent', () => {
  usePageZoom();
  let fixture: ComponentFixture<TextBoxComponent>;
  let component: TextBoxComponent;
  let recorder: EventRecorder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextBoxComponent, SelectionFrameComponent],
      imports: [DragDirective],
    }).compileComponents();
    fixture = TestBed.createComponent(TextBoxComponent);
    component = fixture.componentInstance;
    setInputs({
      textBox: BOX,
      zoom: 1,
      image: createImage(100, 80),
      options: OPTIONS,
      textColor: RED,
      backgroundColor: undefined,
    });
  });

  afterEach(() => recorder?.stop());

  function setInputs(inputs: Partial<TextBoxComponent>) {
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
  }

  function element<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector);
  }

  function textarea(): HTMLTextAreaElement {
    return element('textarea');
  }

  function canvasPixels(): ImageData {
    const canvas: HTMLCanvasElement = element('canvas.tsp-text-box__canvas');
    return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  }

  function drag(target: HTMLElement, dx: number, dy: number) {
    target.dispatchEvent(pointer('pointerdown', 100, 100));
    target.dispatchEvent(pointer('pointermove', 100 + dx, 100 + dy));
    target.dispatchEvent(pointer('pointerup', 100 + dx, 100 + dy));
  }

  it('sits over its area of the image, scaled by the zoom', () => {
    setInputs({ zoom: 2 });
    const box: HTMLElement = element('.tsp-text-box');
    expect([box.style.left, box.style.top, box.style.width, box.style.height]).toEqual([
      '20px',
      '40px',
      '120px',
      '60px',
    ]);
    const canvas: HTMLCanvasElement = element('canvas.tsp-text-box__canvas');
    expect([canvas.width, canvas.height]).toEqual([60, 30]);
    expect(canvas.style.width).toBe('120px');
  });

  it('lays the textarea out in image pixels like the rendered text and scales it by the zoom', () => {
    setInputs({ zoom: 4 });
    const style: CSSStyleDeclaration = textarea().style;
    expect(style.width).toBe('60px');
    expect(style.height).toBe('30px');
    expect(style.lineHeight).toBe(getFontMetrics(OPTIONS).lineHeight + 'px');
    expect(style.whiteSpace).toBe('pre-wrap');
    expect(style.transform).toBe('scale(4)');
  });

  it('shows the text as it will be pasted', () => {
    expect(pointsOfColor(canvasPixels(), RED).length).toBeGreaterThan(5);
    expect(alphaAt({ w: 59, h: 29 }, canvasPixels()), 'a transparent background').toBe(0);

    setInputs({ backgroundColor: WHITE, textColor: BLACK });
    expect(isColor({ w: 59, h: 29 }, canvasPixels(), WHITE)).toBe(true);
    expect(pointsOfColor(canvasPixels(), BLACK).length).toBeGreaterThan(5);
  });

  it('starts with the text of the box and the caret in it', () => {
    expect(textarea().value).toBe('Hi');
    expect(document.activeElement).toBe(textarea());
  });

  it('emits the text as it is typed', () => {
    const emitted: string[] = [];
    component.textChange.subscribe((text) => emitted.push(text));
    textarea().value = 'Hi!';
    textarea().dispatchEvent(new Event('input'));
    expect(emitted).toEqual(['Hi!']);
  });

  it('keeps the keys that edit text from the app shortcuts, but lets other Ctrl shortcuts through', () => {
    recorder = recordEvents(document, 'keydown');
    ['Delete', 'a', 'Backspace'].forEach((key) => textarea().dispatchEvent(keydown(key)));
    ['a', 'z', 'c', 'v', 'x', 'y', 'Home'].forEach((key) => textarea().dispatchEvent(keydown(key, { ctrl: true })));
    expect(recorder.events.length).toBe(0);

    textarea().dispatchEvent(keydown('s', { ctrl: true }));
    textarea().dispatchEvent(keydown('o', { meta: true }));
    expect(recorder.events.length).toBe(2);
  });

  it('cancels on Escape', () => {
    let cancelled: boolean = false;
    component.cancel.subscribe(() => (cancelled = true));
    recorder = recordEvents(document, 'keydown');
    const escape: KeyboardEvent = keydown('Escape');
    textarea().dispatchEvent(escape);
    expect(cancelled).toBe(true);
    expect(escape.defaultPrevented).toBe(true);
    expect(recorder.events.length).toBe(0);
  });

  it('keeps pasted text from the app, which would paste it as an image', () => {
    recorder = recordEvents(document, 'paste');
    textarea().dispatchEvent(pasteEventWithText('pasted'));
    expect(recorder.events.length).toBe(0);
  });

  it('never scrolls the textarea', () => {
    textarea().value = 'x\n'.repeat(50);
    textarea().scrollTop = 40;
    component.resetScroll();
    expect(textarea().scrollTop).toBe(0);
  });

  it('moves the box when its frame is dragged, in image pixels and within the image', () => {
    setInputs({ zoom: 2 });
    const areas: RectangleArea[] = [];
    component.areaChange.subscribe((area) => areas.push(area));

    drag(element('.tsp-text-box__edge--top'), 10, -6);
    drag(element('.tsp-text-box__edge--left'), -1000, 0);

    expect(areas).toEqual([
      { start: { w: 15, h: 17 }, end: { w: 74, h: 46 } },
      { start: { w: 0, h: 20 }, end: { w: 59, h: 49 } },
    ]);
  });

  it('resizes the box with its handles', () => {
    const areas: RectangleArea[] = [];
    component.areaChange.subscribe((area) => areas.push(area));

    drag(element('[data-handle="se"]'), 5, 3);
    drag(element('[data-handle="w"]'), 4, 50);

    expect(areas).toEqual([
      { start: { w: 10, h: 20 }, end: { w: 74, h: 52 } },
      { start: { w: 14, h: 20 }, end: { w: 69, h: 49 } },
    ]);
    expect(fixture.nativeElement.querySelectorAll('.tsp-text-box__handle').length).toBe(8);
  });

  it('frames the box', () => {
    const frame: HTMLCanvasElement = element('tsp-selection-frame canvas');
    expect([frame.width, frame.height]).toEqual([64, 34]);
  });

  it('takes the focus back after a color or option change if nothing else has it', () => {
    textarea().blur();
    setInputs({ textColor: BLACK });
    expect(document.activeElement).toBe(textarea());

    const other: HTMLInputElement = document.createElement('input');
    document.body.appendChild(other);
    try {
      other.focus();
      setInputs({ options: { ...OPTIONS, bold: true } });
      expect(document.activeElement, 'a field of the Fonts window keeps the focus').toBe(other);
    } finally {
      other.remove();
    }
  });
});
