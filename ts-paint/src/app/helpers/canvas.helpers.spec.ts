import { loadImageToCanvas } from './canvas.helpers';
import { createImage } from './image.helpers';
import { BLUE, RED, isColor, setPixel } from '../../testing/image-test.helpers';

describe('loadImageToCanvas', () => {
  it('resizes the canvas to the image', () => {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;

    loadImageToCanvas(createImage(7, 4), canvas);

    expect(canvas.width).toBe(7);
    expect(canvas.height).toBe(4);
  });

  it('draws the image pixels onto the canvas', () => {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const image: ImageData = createImage(3, 3, RED);
    setPixel(image, { w: 2, h: 1 }, BLUE);

    loadImageToCanvas(image, canvas);

    const drawn: ImageData = canvas.getContext('2d').getImageData(0, 0, 3, 3);
    expect(isColor({ w: 0, h: 0 }, drawn, RED)).toBe(true);
    expect(isColor({ w: 2, h: 1 }, drawn, BLUE)).toBe(true);
  });

  it('replaces whatever was on the canvas before', () => {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    loadImageToCanvas(createImage(2, 2, BLUE), canvas);

    loadImageToCanvas(createImage(2, 2, RED), canvas);

    const drawn: ImageData = canvas.getContext('2d').getImageData(0, 0, 2, 2);
    expect(isColor({ w: 1, h: 1 }, drawn, RED)).toBe(true);
  });
});
