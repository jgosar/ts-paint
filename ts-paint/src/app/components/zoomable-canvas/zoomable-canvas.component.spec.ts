import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoomableCanvasComponent } from './zoomable-canvas.component';
import { createImage } from '../../helpers/image.helpers';
import { BLACK, imageFromMask, isColor, RED, WHITE } from '../../../testing/image-test.helpers';
import { Point } from '../../types/base/point';

describe('ZoomableCanvasComponent', () => {
  let fixture: ComponentFixture<ZoomableCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [ZoomableCanvasComponent] }).compileComponents();
    fixture = TestBed.createComponent(ZoomableCanvasComponent);
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

  it('sizes the canvas to the whole image at zoom 1 with no offset and copies its pixels', () => {
    setInputs({ image: imageFromMask(['#..', '.#.', '..#']) });

    expect(canvas().width).toBe(3);
    expect(canvas().height).toBe(3);
    expect(canvas().style.width).toBe('3px');
    expect(canvas().style.height).toBe('3px');
    expect(canvas().style.left).toBe('0px');
    expect(canvas().style.top).toBe('0px');
    expect(isColor({ w: 0, h: 0 }, canvasPixels(), BLACK)).toBe(true);
    expect(isColor({ w: 1, h: 0 }, canvasPixels(), WHITE)).toBe(true);
    expect(isColor({ w: 2, h: 2 }, canvasPixels(), BLACK)).toBe(true);
  });

  it('scales the css size and offset by the zoom while keeping the canvas at image resolution', () => {
    setInputs({
      image: createImage(10, 6, RED),
      parentImage: createImage(40, 40, WHITE),
      zoom: 4,
      offset: { w: 3, h: 2 },
    });

    expect(canvas().width).toBe(10);
    expect(canvas().height).toBe(6);
    expect(canvas().style.width).toBe('40px');
    expect(canvas().style.height).toBe('24px');
    expect(canvas().style.left).toBe('12px');
    expect(canvas().style.top).toBe('8px');
    expect(isColor({ w: 9, h: 5 }, canvasPixels(), RED)).toBe(true);
  });

  it('clips the canvas to the parent image when a positive offset pushes the image past its edge', () => {
    setInputs({
      image: createImage(10, 10, RED),
      parentImage: createImage(12, 15, WHITE),
      zoom: 2,
      offset: { w: 5, h: 8 },
    });

    expect(canvas().width).toBe(7);
    expect(canvas().height).toBe(7);
    expect(canvas().style.width).toBe('14px');
    expect(canvas().style.height).toBe('14px');
    expect(canvas().style.left).toBe('10px');
    expect(canvas().style.top).toBe('16px');
  });

  it('shrinks the canvas for a negative offset and shifts the image so the hidden part is cut off', () => {
    const image: ImageData = imageFromMask(['.....', '.....', '...#.', '.....']);
    setInputs({ image, parentImage: createImage(20, 20, WHITE), zoom: 1, offset: { w: -3, h: -2 } });

    expect(canvas().width).toBe(2);
    expect(canvas().height).toBe(2);
    expect(canvas().style.left).toBe('0px');
    expect(canvas().style.top).toBe('0px');
    expect(isColor({ w: 0, h: 0 }, canvasPixels(), BLACK)).toBe(true);
    expect(isColor({ w: 1, h: 0 }, canvasPixels(), WHITE)).toBe(true);
    expect(isColor({ w: 0, h: 1 }, canvasPixels(), WHITE)).toBe(true);
  });

  it('uses the image itself as the clipping parent when there is no parent image', () => {
    setInputs({ image: createImage(10, 10, RED), zoom: 1, offset: { w: 4, h: 0 } });

    expect(canvas().width).toBe(6);
    expect(canvas().height).toBe(10);
    expect(canvas().style.left).toBe('4px');
  });

  it('collapses the canvas to 0x0 when there is no image', () => {
    setInputs({ image: createImage(10, 10, RED) });
    setInputs({ image: undefined });

    expect(canvas().width).toBe(0);
    expect(canvas().height).toBe(0);
  });

  it('keeps the previous css size when the image is removed (only the canvas resolution is reset)', () => {
    setInputs({ image: createImage(10, 10, RED), zoom: 2 });
    setInputs({ image: undefined });

    expect(canvas().style.width).toBe('20px');
    expect(canvas().style.height).toBe('20px');
  });

  it('toggles the invert background class', () => {
    setInputs({ image: createImage(2, 2, RED) });
    expect(canvas().classList.contains('tsp-zoomable-canvas__canvas--invert_background')).toBe(false);

    fixture.componentRef.setInput('invertBackground', true);
    fixture.detectChanges();
    expect(canvas().classList.contains('tsp-zoomable-canvas__canvas--invert_background')).toBe(true);
  });
});
