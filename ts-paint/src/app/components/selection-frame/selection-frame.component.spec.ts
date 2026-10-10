import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectionFrameComponent } from './selection-frame.component';
import { createImage } from '../../helpers/image.helpers';
import { alphaAt, isColor, RED, WHITE } from '../../../testing/image-test.helpers';
import { Color } from '../../types/base/color';
import { Point } from '../../types/base/point';

describe('SelectionFrameComponent', () => {
  const BLUEISH: Color = { r: 0, g: 120, b: 215 };
  let fixture: ComponentFixture<SelectionFrameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [SelectionFrameComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectionFrameComponent);
    // Like the app, the frame is rendered once without a selection before any selection image arrives
    fixture.detectChanges();
  });

  function canvas(): HTMLCanvasElement {
    return fixture.nativeElement.querySelector('canvas');
  }

  function canvasPixels(): ImageData {
    return canvas().getContext('2d').getImageData(0, 0, canvas().width, canvas().height);
  }

  function setInputs(inputs: { image?: ImageData; parentImage?: ImageData; zoom?: number; offset?: Point }) {
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
  }

  it('leaves the canvas untouched while there is no selection image', () => {
    expect(canvas().width).toBe(300);
    expect(canvas().height).toBe(150);
    expect(canvas().style.width).toBe('0px');
    expect(canvas().style.left).toBe('0px');
  });

  it('sizes the frame to the zoomed selection plus 2px padding on each side and offsets it by -2px', () => {
    setInputs({
      image: createImage(10, 6, RED),
      parentImage: createImage(40, 40, WHITE),
      zoom: 3,
      offset: { w: 4, h: 5 },
    });

    expect(canvas().width).toBe(34);
    expect(canvas().height).toBe(22);
    expect(canvas().style.width).toBe('34px');
    expect(canvas().style.height).toBe('22px');
    expect(canvas().style.left).toBe('10px');
    expect(canvas().style.top).toBe('13px');
  });

  it('clips the frame to the parent image for a positive offset and shrinks it for a negative one', () => {
    setInputs({
      image: createImage(10, 10, RED),
      parentImage: createImage(12, 20, WHITE),
      zoom: 2,
      offset: { w: 5, h: -3 },
    });

    expect(canvas().width).toBe(7 * 2 + 4);
    expect(canvas().height).toBe(7 * 2 + 4);
    expect(canvas().style.left).toBe('8px');
    expect(canvas().style.top).toBe('-2px');
  });

  it('draws a dashed white/blue frame along the edges and leaves the inside transparent', () => {
    setInputs({ image: createImage(8, 8, RED), zoom: 1 });
    const pixels: ImageData = canvasPixels();
    const last: number = pixels.width - 1;

    // Dashes of 4 alternate, starting with 3 white pixels (floor((i + 1) / 4) % 2). The vertical pass paints the
    // corners last, so the top corners take the row-0 color (white) and the bottom corners the row-11 color (blue).
    const colorAt = (w: number, h: number) =>
      isColor({ w, h }, pixels, WHITE) ? 'W' : isColor({ w, h }, pixels, BLUEISH) ? 'B' : '?';
    const topRow: string = Array.from({ length: pixels.width }, (_, w) => colorAt(w, 0)).join('');
    const bottomRow: string = Array.from({ length: pixels.width }, (_, w) => colorAt(w, last)).join('');
    const leftColumn: string = Array.from({ length: pixels.height }, (_, h) => colorAt(0, h)).join('');
    const rightColumn: string = Array.from({ length: pixels.height }, (_, h) => colorAt(last, h)).join('');
    expect(topRow).toBe('WWWBBBBWWWWW');
    expect(bottomRow).toBe('BWWBBBBWWWWB');
    expect(leftColumn).toBe('WWWBBBBWWWWB');
    expect(rightColumn).toBe('WWWBBBBWWWWB');
    expect(alphaAt({ w: 0, h: 0 }, pixels)).toBe(255);
    expect(alphaAt({ w: 1, h: 1 }, pixels)).toBe(0);
    expect(alphaAt({ w: 6, h: 6 }, pixels)).toBe(0);
  });

  it('redraws the frame when the zoom changes', () => {
    setInputs({ image: createImage(4, 4, RED), zoom: 1 });
    expect(canvas().width).toBe(8);

    setInputs({ zoom: 5 });

    expect(canvas().width).toBe(24);
    expect(canvas().height).toBe(24);
    expect(alphaAt({ w: 23, h: 23 }, canvasPixels())).toBe(255);
  });

  // Quirk: the view child is not static, so it is only resolved by the first change detection. In the app this
  // never matters because the frame is always rendered first without a selection image (see the ngStyle display
  // toggle in ts-paint.component.html), but ngOnChanges with an image before the first detectChanges throws.
  it('quirk: throws when an image is set before the view has been created', () => {
    const fresh: ComponentFixture<SelectionFrameComponent> = TestBed.createComponent(SelectionFrameComponent);
    fresh.componentInstance.image = createImage(4, 4, RED);
    expect(() => fresh.componentInstance.ngOnChanges()).toThrow();
  });
});
