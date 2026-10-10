import { vi } from 'vitest';
import {
  calculateLocation,
  cloneImage,
  constrainPointToImage,
  copyImagePart,
  createImage,
  expandAreaWithinImage,
  fillArea,
  fillAreaInOriginalImage,
  fillImage,
  getAreaHeight,
  getAreaInImage,
  getAreaWidth,
  getImagePart,
  getPixelOffset,
  isPointInRectangle,
  isSubpixelInRectangle,
  pasteImagePart,
  resizeImage,
  setPixelInOriginalImage,
  unzoomPoint,
} from './image.helpers';
import { RectangleArea } from '../types/base/rectangle-area';
import {
  BLACK,
  BLUE,
  RED,
  WHITE,
  alphaAt,
  isColor,
  maskOf,
  pointsOfColor,
  setPixel,
} from '../../testing/image-test.helpers';

const RECT: RectangleArea = { start: { w: 2, h: 3 }, end: { w: 5, h: 6 } };
const REVERSED_RECT: RectangleArea = { start: { w: 5, h: 6 }, end: { w: 2, h: 3 } };

describe('createImage', () => {
  it('creates an image of the given size filled with the color', () => {
    const image: ImageData = createImage(3, 2, RED);

    expect(image.width).toBe(3);
    expect(image.height).toBe(2);
    expect(pointsOfColor(image, RED).length).toBe(6);
    expect(alphaAt({ w: 2, h: 1 }, image)).toBe(255);
  });

  it('is white by default', () => {
    expect(pointsOfColor(createImage(2, 2), WHITE).length).toBe(4);
  });
});

describe('cloneImage', () => {
  it('copies every pixel into an independent buffer', () => {
    const original: ImageData = createImage(4, 4, WHITE);
    setPixel(original, { w: 1, h: 2 }, RED);

    const clone: ImageData = cloneImage(original);

    expect(clone).not.toBe(original);
    expect(clone.data).not.toBe(original.data);
    expect(clone.data).toEqual(original.data);
    setPixel(clone, { w: 0, h: 0 }, BLACK);
    expect(isColor({ w: 0, h: 0 }, original, WHITE)).toBe(true);
  });
});

describe('fillImage', () => {
  it('returns a new image with every pixel set to the color', () => {
    const image: ImageData = createImage(3, 3, WHITE);

    const filled: ImageData = fillImage(image, BLUE);

    expect(filled).not.toBe(image);
    expect(pointsOfColor(filled, BLUE).length).toBe(9);
    expect(pointsOfColor(image, WHITE).length, 'the original is untouched').toBe(9);
  });
});

describe('fillArea', () => {
  it('fills the rectangle in a new image and leaves the original untouched', () => {
    const image: ImageData = createImage(8, 8, WHITE);

    const result: ImageData = fillArea(image, BLACK, RECT);

    expect(result).not.toBe(image);
    expect(pointsOfColor(image, BLACK)).toEqual([]);
    expect(maskOf(result)).toEqual([
      '........',
      '........',
      '........',
      '..####..',
      '..####..',
      '..####..',
      '..####..',
      '........',
    ]);
  });

  it('accepts reversed corners', () => {
    const image: ImageData = createImage(8, 8, WHITE);
    expect(maskOf(fillArea(image, BLACK, REVERSED_RECT))).toEqual(maskOf(fillArea(image, BLACK, RECT)));
  });

  it('uses the alpha of the color when given, also for the pixels outside the area', () => {
    const image: ImageData = createImage(2, 1, WHITE);

    const result: ImageData = fillArea(image, { ...BLACK, a: 7 }, { start: { w: 0, h: 0 }, end: { w: 0, h: 0 } });

    // Quirk: the color's alpha is also applied to the pixels that keep their original RGB
    expect(alphaAt({ w: 0, h: 0 }, result)).toBe(7);
    expect(alphaAt({ w: 1, h: 0 }, result)).toBe(7);
    expect(isColor({ w: 1, h: 0 }, result, WHITE)).toBe(true);
  });
});

describe('fillAreaInOriginalImage', () => {
  it('fills the rectangle in place', () => {
    const image: ImageData = createImage(8, 8, WHITE);

    fillAreaInOriginalImage(image, BLACK, RECT);

    expect(maskOf(image)).toEqual([
      '........',
      '........',
      '........',
      '..####..',
      '..####..',
      '..####..',
      '..####..',
      '........',
    ]);
  });

  it('writes the color alpha, defaulting to opaque', () => {
    const image: ImageData = new ImageData(2, 1);

    fillAreaInOriginalImage(image, BLACK, { start: { w: 0, h: 0 }, end: { w: 0, h: 0 } });
    fillAreaInOriginalImage(image, { ...RED, a: 9 }, { start: { w: 1, h: 0 }, end: { w: 1, h: 0 } });

    expect(alphaAt({ w: 0, h: 0 }, image)).toBe(255);
    expect(alphaAt({ w: 1, h: 0 }, image)).toBe(9);
    expect(isColor({ w: 1, h: 0 }, image, RED)).toBe(true);
  });
});

describe('isPointInRectangle', () => {
  it('includes the corners and the inside', () => {
    expect(isPointInRectangle({ w: 2, h: 3 }, RECT)).toBe(true);
    expect(isPointInRectangle({ w: 5, h: 6 }, RECT)).toBe(true);
    expect(isPointInRectangle({ w: 3, h: 4 }, RECT)).toBe(true);
  });

  it('excludes points outside on any side', () => {
    expect(isPointInRectangle({ w: 1, h: 4 }, RECT)).toBe(false);
    expect(isPointInRectangle({ w: 6, h: 4 }, RECT)).toBe(false);
    expect(isPointInRectangle({ w: 3, h: 2 }, RECT)).toBe(false);
    expect(isPointInRectangle({ w: 3, h: 7 }, RECT)).toBe(false);
  });

  it('works with reversed corners', () => {
    expect(isPointInRectangle({ w: 3, h: 4 }, REVERSED_RECT)).toBe(true);
    expect(isPointInRectangle({ w: 1, h: 4 }, REVERSED_RECT)).toBe(false);
  });
});

describe('isSubpixelInRectangle', () => {
  it('maps the subpixel offset to a pixel and checks that', () => {
    const image: ImageData = createImage(10, 10);
    const inside: number = 4 * (3 + 10 * 4);
    const outside: number = 4 * (6 + 10 * 4);

    expect(isSubpixelInRectangle(inside, RECT, image)).toBe(true);
    expect(isSubpixelInRectangle(inside + 3, RECT, image), 'the alpha subpixel belongs to the same pixel').toBe(true);
    expect(isSubpixelInRectangle(outside, RECT, image)).toBe(false);
  });
});

describe('calculateLocation', () => {
  it('converts a subpixel offset into a point', () => {
    const image: ImageData = createImage(10, 5);

    expect(calculateLocation(0, image)).toEqual({ w: 0, h: 0 });
    expect(calculateLocation(4 * 9, image)).toEqual({ w: 9, h: 0 });
    expect(calculateLocation(4 * 10, image)).toEqual({ w: 0, h: 1 });
    expect(calculateLocation(4 * 23 + 2, image)).toEqual({ w: 3, h: 2 });
  });
});

describe('getPixelOffset', () => {
  it('returns the offset of the first subpixel', () => {
    const image: ImageData = createImage(10, 5);

    expect(getPixelOffset({ w: 0, h: 0 }, image)).toBe(0);
    expect(getPixelOffset({ w: 3, h: 2 }, image)).toBe(4 * 23);
    expect(getPixelOffset({ w: 9, h: 4 }, image)).toBe(4 * 49);
  });

  it('is undefined outside the image', () => {
    const image: ImageData = createImage(10, 5);

    expect(getPixelOffset({ w: 10, h: 0 }, image)).toBeUndefined();
    expect(getPixelOffset({ w: 0, h: 5 }, image)).toBeUndefined();
    expect(getPixelOffset({ w: -1, h: 0 }, image)).toBeUndefined();
    expect(getPixelOffset({ w: 0, h: -1 }, image)).toBeUndefined();
  });
});

describe('setPixelInOriginalImage', () => {
  it('writes the color with full alpha in place', () => {
    const image: ImageData = new ImageData(3, 3);

    setPixelInOriginalImage({ w: 1, h: 2 }, { ...RED, a: 3 }, image);

    expect(isColor({ w: 1, h: 2 }, image, RED)).toBe(true);
    expect(alphaAt({ w: 1, h: 2 }, image), 'the color alpha is ignored').toBe(255);
    expect(pointsOfColor(image, RED)).toEqual([{ w: 1, h: 2 }]);
  });

  it('ignores points outside the image', () => {
    const image: ImageData = createImage(3, 3, WHITE);

    expect(() => setPixelInOriginalImage({ w: 3, h: 0 }, RED, image)).not.toThrow();
    expect(() => setPixelInOriginalImage({ w: -1, h: -1 }, RED, image)).not.toThrow();

    expect(pointsOfColor(image, RED)).toEqual([]);
  });
});

describe('getImagePart', () => {
  function striped(): ImageData {
    const image: ImageData = createImage(6, 6, WHITE);
    fillAreaInOriginalImage(image, RED, { start: { w: 0, h: 2 }, end: { w: 5, h: 2 } });
    setPixel(image, { w: 4, h: 3 }, BLUE);
    return image;
  }

  it('copies the pixels of the area', () => {
    const part: ImageData = getImagePart({ start: { w: 3, h: 2 }, end: { w: 5, h: 4 } }, striped());

    expect(part.width).toBe(3);
    expect(part.height).toBe(3);
    expect(maskOf(part, RED)).toEqual(['###', '...', '...']);
    expect(maskOf(part, BLUE)).toEqual(['...', '.#.', '...']);
    expect(maskOf(part, WHITE)).toEqual(['...', '#.#', '###']);
  });

  it('accepts reversed corners', () => {
    const part: ImageData = getImagePart({ start: { w: 5, h: 4 }, end: { w: 3, h: 2 } }, striped());
    expect(maskOf(part, BLUE)).toEqual(['...', '.#.', '...']);
  });

  it('clips the area to the image', () => {
    const part: ImageData = getImagePart({ start: { w: 4, h: -2 }, end: { w: 20, h: 3 } }, striped());

    expect(part.width).toBe(2);
    expect(part.height).toBe(4);
    expect(maskOf(part, RED)).toEqual(['..', '..', '##', '..']);
    expect(maskOf(part, BLUE)).toEqual(['..', '..', '..', '#.']);
  });
});

describe('getAreaInImage', () => {
  const image: ImageData = createImage(10, 8);

  it('normalises reversed corners', () => {
    expect(getAreaInImage(REVERSED_RECT, image)).toEqual(RECT);
  });

  it('clips to the image bounds', () => {
    expect(getAreaInImage({ start: { w: -5, h: -5 }, end: { w: 50, h: 50 } }, image)).toEqual({
      start: { w: 0, h: 0 },
      end: { w: 9, h: 7 },
    });
  });

  it('leaves an area inside the image unchanged', () => {
    expect(getAreaInImage(RECT, image)).toEqual(RECT);
  });
});

describe('expandAreaWithinImage', () => {
  const image: ImageData = createImage(10, 10);

  it('grows the area by before towards the top left and by after towards the bottom right', () => {
    expect(expandAreaWithinImage(RECT, 1, 2, image)).toEqual({ start: { w: 1, h: 2 }, end: { w: 7, h: 8 } });
  });

  it('normalises reversed corners before expanding', () => {
    expect(expandAreaWithinImage(REVERSED_RECT, 1, 2, image)).toEqual(expandAreaWithinImage(RECT, 1, 2, image));
  });

  it('clips the expanded area to the image', () => {
    expect(expandAreaWithinImage(RECT, 5, 10, image)).toEqual({ start: { w: 0, h: 0 }, end: { w: 9, h: 9 } });
  });
});

describe('getAreaWidth / getAreaHeight', () => {
  it('counts both end pixels', () => {
    expect(getAreaWidth(RECT)).toBe(4);
    expect(getAreaHeight(RECT)).toBe(4);
  });

  it('is 1 for a single point', () => {
    const point: RectangleArea = { start: { w: 3, h: 3 }, end: { w: 3, h: 3 } };
    expect(getAreaWidth(point)).toBe(1);
    expect(getAreaHeight(point)).toBe(1);
  });

  it('does not depend on the corner order', () => {
    expect(getAreaWidth(REVERSED_RECT)).toBe(4);
    expect(getAreaHeight(REVERSED_RECT)).toBe(4);
  });
});

describe('constrainPointToImage', () => {
  const image: ImageData = createImage(10, 5);

  it('leaves points inside the image alone', () => {
    expect(constrainPointToImage(image, { w: 3, h: 4 })).toEqual({ w: 3, h: 4 });
  });

  it('clamps to the image edges', () => {
    expect(constrainPointToImage(image, { w: -3, h: -1 })).toEqual({ w: 0, h: 0 });
    expect(constrainPointToImage(image, { w: 10, h: 5 })).toEqual({ w: 9, h: 4 });
  });

  it('clamps to the origin when there is no image', () => {
    expect(constrainPointToImage(undefined, { w: 7, h: 7 })).toEqual({ w: 0, h: 0 });
  });
});

describe('unzoomPoint', () => {
  it('divides by the zoom, rounding down', () => {
    expect(unzoomPoint({ w: 15, h: 9 }, 4)).toEqual({ w: 3, h: 2 });
    expect(unzoomPoint({ w: 16, h: 8 }, 4)).toEqual({ w: 4, h: 2 });
  });

  it('is the identity at zoom 1', () => {
    expect(unzoomPoint({ w: 15, h: 9 }, 1)).toEqual({ w: 15, h: 9 });
  });
});

describe('pasteImagePart', () => {
  it('draws the part at the location in a new image', () => {
    const image: ImageData = createImage(6, 6, WHITE);
    const part: ImageData = createImage(2, 3, RED);

    const result: ImageData = pasteImagePart({ w: 3, h: 1 }, part, image);

    expect(result).not.toBe(image);
    expect(result.width).toBe(6);
    expect(maskOf(result, RED)).toEqual(['......', '...##.', '...##.', '...##.', '......', '......']);
    expect(pointsOfColor(image, RED), 'the original is untouched').toEqual([]);
  });

  it('clips parts that hang over the edge', () => {
    const image: ImageData = createImage(4, 4, WHITE);
    const part: ImageData = createImage(3, 3, BLACK);

    const result: ImageData = pasteImagePart({ w: 2, h: 3 }, part, image);

    expect(maskOf(result)).toEqual(['....', '....', '....', '..##']);
  });

  it('overwrites pixels instead of blending, including transparent ones', () => {
    const image: ImageData = createImage(2, 1, BLACK);
    const part: ImageData = new ImageData(1, 1);

    const result: ImageData = pasteImagePart({ w: 1, h: 0 }, part, image);

    expect(alphaAt({ w: 1, h: 0 }, result)).toBe(0);
    expect(isColor({ w: 0, h: 0 }, result, BLACK)).toBe(true);
  });
});

describe('resizeImage', () => {
  function withRedCorner(): ImageData {
    const image: ImageData = createImage(3, 3, WHITE);
    setPixel(image, { w: 2, h: 2 }, RED);
    return image;
  }

  it('pads a grown image with the background color, keeping the old pixels at the top left', () => {
    const resized: ImageData = resizeImage(withRedCorner(), 5, 4, BLUE);

    expect(resized.width).toBe(5);
    expect(resized.height).toBe(4);
    expect(maskOf(resized, WHITE)).toEqual(['###..', '###..', '##...', '.....']);
    expect(maskOf(resized, RED)).toEqual(['.....', '.....', '..#..', '.....']);
    expect(maskOf(resized, BLUE)).toEqual(['...##', '...##', '...##', '#####']);
  });

  it('crops a shrunk image to its top left corner', () => {
    const resized: ImageData = resizeImage(withRedCorner(), 2, 2, BLUE);

    expect(resized.width).toBe(2);
    expect(resized.height).toBe(2);
    expect(pointsOfColor(resized, WHITE).length).toBe(4);
  });

  it('can grow in one direction and shrink in the other', () => {
    const resized: ImageData = resizeImage(withRedCorner(), 1, 5, BLUE);

    expect(maskOf(resized, WHITE)).toEqual(['#', '#', '#', '.', '.']);
    expect(maskOf(resized, BLUE)).toEqual(['.', '.', '.', '#', '#']);
  });
});

describe('copyImagePart', () => {
  const originalClipboard: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalToBlob: typeof HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.toBlob;

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      delete (navigator as any).clipboard;
    }
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    vi.restoreAllMocks();
  });

  function stubClipboard(write: (items: ClipboardItem[]) => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write } });
  }

  /** Makes toBlob call back synchronously so that the test does not have to wait for the encoder */
  function stubToBlobWith(blob: Blob | null) {
    HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
      callback(blob);
    };
  }

  it('writes a PNG clipboard item built from the image', () => {
    const blob: Blob = new Blob(['fake png'], { type: 'image/png' });
    stubToBlobWith(blob);
    const write = vi.fn().mockResolvedValue(undefined);
    stubClipboard(write);

    copyImagePart(createImage(2, 2, RED));

    expect(write).toHaveBeenCalledTimes(1);
    const items: ClipboardItem[] = write.mock.calls[0][0];
    expect(items.length).toBe(1);
    expect(items[0].types).toEqual(['image/png']);
  });

  it('loads the image into the canvas before encoding it', () => {
    let encodedCanvas: HTMLCanvasElement | undefined;
    HTMLCanvasElement.prototype.toBlob = function () {
      encodedCanvas = this;
    };
    stubClipboard(vi.fn());

    copyImagePart(createImage(3, 2, RED));

    expect(encodedCanvas.width).toBe(3);
    expect(encodedCanvas.height).toBe(2);
    expect(isColor({ w: 2, h: 1 }, encodedCanvas.getContext('2d').getImageData(0, 0, 3, 2), RED)).toBe(true);
  });

  it('alerts instead of throwing when the clipboard cannot take images', () => {
    stubToBlobWith(new Blob(['fake png'], { type: 'image/png' }));
    stubClipboard(() => {
      throw new Error('not supported');
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    expect(() => copyImagePart(createImage(1, 1, RED))).not.toThrow();

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain('does not support copying images');
  });
});
