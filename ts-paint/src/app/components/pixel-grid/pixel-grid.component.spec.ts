import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PixelGridComponent } from './pixel-grid.component';
import { createImage } from '../../helpers/image.helpers';
import { createGridTile } from '../../helpers/grid.helpers';

describe('PixelGridComponent', () => {
  let fixture: ComponentFixture<PixelGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [PixelGridComponent] }).compileComponents();
    fixture = TestBed.createComponent(PixelGridComponent);
  });

  function setInputs(inputs: { image?: ImageData; zoom?: number }) {
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
  }

  function grid(): HTMLElement {
    return fixture.nativeElement;
  }

  /** The picture the grid is tiled with, decoded */
  async function backgroundTile(): Promise<ImageData> {
    const url: string = /^url\("(.*)"\)$/.exec(getComputedStyle(grid()).backgroundImage)[1];
    const picture: HTMLImageElement = new Image();
    picture.src = url;
    await picture.decode();
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = picture.width;
    canvas.height = picture.height;
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.drawImage(picture, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  it('covers the zoomed image, plus one pixel for the lines that close it on the right and at the bottom', () => {
    setInputs({ image: createImage(10, 6), zoom: 4 });

    expect(grid().getBoundingClientRect().width).toBe(41);
    expect(grid().getBoundingClientRect().height).toBe(25);
  });

  it('is tiled with the grid lines of one image pixel', async () => {
    setInputs({ image: createImage(10, 6), zoom: 4 });

    expect(getComputedStyle(grid()).backgroundSize).toBe('4px');
    expect(getComputedStyle(grid()).backgroundRepeat).toBe('repeat');
    expect(Array.from((await backgroundTile()).data)).toEqual(Array.from(createGridTile(4).data));
  });

  it('follows the zoom', async () => {
    setInputs({ image: createImage(10, 6), zoom: 4 });
    setInputs({ zoom: 8 });

    expect(grid().getBoundingClientRect().width).toBe(81);
    expect(getComputedStyle(grid()).backgroundSize).toBe('8px');
    expect(Array.from((await backgroundTile()).data)).toEqual(Array.from(createGridTile(8).data));
  });

  it('follows the size of the image', () => {
    setInputs({ image: createImage(10, 6), zoom: 4 });
    setInputs({ image: createImage(3, 2) });

    expect(grid().getBoundingClientRect().width).toBe(13);
    expect(grid().getBoundingClientRect().height).toBe(9);
  });

  it('keeps its lines sharp on any screen and lets the mouse through to the image', () => {
    setInputs({ image: createImage(10, 6), zoom: 4 });

    expect(getComputedStyle(grid()).imageRendering).toBe('pixelated');
    expect(getComputedStyle(grid()).pointerEvents).toBe('none');
    expect(getComputedStyle(grid()).position).toBe('absolute');
  });
});
