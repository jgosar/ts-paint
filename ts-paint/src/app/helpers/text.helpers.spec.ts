import {
  CLICKED_TEXT_BOX_WIDTH,
  cssFont,
  cssFontFamily,
  fitTextBox,
  getFontMetrics,
  getMinTextBoxSize,
  getNewTextBoxArea,
  getTextLayoutStyles,
  layoutText,
  pointsToPixels,
  renderTextBox,
} from './text.helpers';
import { TextOptions } from '../types/drawing-tools/drawing-tool-options';
import { TextBox } from '../types/base/text-box';
import { Point } from '../types/base/point';
import { areaFromStartAndSize, areaSize } from './area.helpers';
import { alphaAt, BLACK, isColor, pointsOfColor, RED, WHITE } from '../../testing/image-test.helpers';
import { getPixel } from './drawing.helpers';

// A generic family, so that the tests do not depend on the fonts of the machine they run on
const OPTIONS: TextOptions = { fontFamily: 'monospace', fontSize: 12, bold: false, italic: false, underline: false };
const IMAGE_SIZE: Point = { w: 300, h: 200 };

describe('pointsToPixels', () => {
  it('converts points to css px at 96 dpi', () => {
    expect(pointsToPixels(9)).toBe(12);
    expect(pointsToPixels(72)).toBe(96);
  });
});

describe('cssFontFamily', () => {
  it('leaves generic families unquoted', () => {
    expect(cssFontFamily('serif')).toBe('serif');
    expect(cssFontFamily('monospace')).toBe('monospace');
  });

  it('quotes other families, escapes quotes, and falls back to sans-serif', () => {
    expect(cssFontFamily('Times New Roman')).toBe('"Times New Roman", sans-serif');
    expect(cssFontFamily('My "Font"')).toBe('"My \\"Font\\"", sans-serif');
  });
});

describe('cssFont', () => {
  it('lists the style, weight, size in px and family', () => {
    expect(cssFont(OPTIONS)).toBe('16px monospace');
    expect(cssFont({ ...OPTIONS, bold: true, italic: true, fontFamily: 'Arial' })).toBe(
      'italic bold 16px "Arial", sans-serif'
    );
  });
});

describe('getFontMetrics', () => {
  it('gives whole pixel ascent and descent that add up to the line height', () => {
    const metrics = getFontMetrics(OPTIONS);
    expect(Number.isInteger(metrics.ascent)).toBe(true);
    expect(Number.isInteger(metrics.descent)).toBe(true);
    expect(metrics.ascent).toBeGreaterThan(metrics.descent);
    expect(metrics.lineHeight).toBe(metrics.ascent + metrics.descent);
  });

  it('grows with the font size', () => {
    expect(getFontMetrics({ ...OPTIONS, fontSize: 36 }).lineHeight).toBeGreaterThan(getFontMetrics(OPTIONS).lineHeight);
  });
});

describe('getTextLayoutStyles', () => {
  it('fixes the font, the line height and the width, and wraps like a textarea', () => {
    const styles: Record<string, string> = getTextLayoutStyles(OPTIONS, 120);
    expect(styles.font).toBe(cssFont(OPTIONS));
    expect(styles.lineHeight).toBe(getFontMetrics(OPTIONS).lineHeight + 'px');
    expect(styles.width).toBe('120px');
    expect(styles.whiteSpace).toBe('pre-wrap');
    expect(styles.overflowWrap).toBe('break-word');
    expect(styles.padding).toBe('0');
  });
});

describe('layoutText', () => {
  const lineHeight: number = getFontMetrics(OPTIONS).lineHeight;

  it('gives one empty line for no text', () => {
    expect(layoutText('', OPTIONS, 100)).toEqual({
      lines: [''],
      lineHeight,
      ascent: getFontMetrics(OPTIONS).ascent,
      height: lineHeight,
    });
  });

  it('starts a line at each line break, including a final one', () => {
    expect(layoutText('one\ntwo\n', OPTIONS, 300).lines).toEqual(['one', 'two', '']);
  });

  it('wraps long text at the width, keeping every character', () => {
    const text: string = 'the quick brown fox jumps over the lazy dog';
    const layout = layoutText(text, OPTIONS, 80);
    expect(layout.lines.length).toBeGreaterThan(2);
    expect(layout.lines.join('')).toBe(text);
    expect(layout.height).toBe(layout.lines.length * lineHeight);
    expect(layout.lines[0].startsWith('the ')).toBe(true);
  });

  it('breaks a word that is longer than the line', () => {
    const layout = layoutText('x'.repeat(40), OPTIONS, 50);
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.join('')).toBe('x'.repeat(40));
  });

  it('keeps characters outside the basic plane whole', () => {
    const text: string = '😀😀😀😀😀😀😀😀😀😀😀😀';
    expect(layoutText(text, OPTIONS, 40).lines.join('')).toBe(text);
  });

  it('removes its measuring element', () => {
    const children: number = document.body.children.length;
    layoutText('abc', OPTIONS, 50);
    expect(document.body.children.length).toBe(children);
  });
});

describe('getNewTextBoxArea', () => {
  it('spans the dragged rectangle, whichever way it was dragged', () => {
    expect(
      getNewTextBoxArea(
        [
          { w: 100, h: 80 },
          { w: 20, h: 10 },
        ],
        OPTIONS,
        IMAGE_SIZE
      )
    ).toEqual({
      start: { w: 20, h: 10 },
      end: { w: 100, h: 80 },
    });
  });

  it('makes a box of the default width and one line high for a click', () => {
    const area = getNewTextBoxArea(
      [
        { w: 20, h: 10 },
        { w: 21, h: 11 },
      ],
      OPTIONS,
      IMAGE_SIZE
    );
    expect(area.start).toEqual({ w: 20, h: 10 });
    expect(areaSize(area)).toEqual({ w: CLICKED_TEXT_BOX_WIDTH, h: getFontMetrics(OPTIONS).lineHeight });
  });

  it('keeps a box made near the edge inside the image', () => {
    const area = getNewTextBoxArea(
      [
        { w: 290, h: 195 },
        { w: 290, h: 195 },
      ],
      OPTIONS,
      IMAGE_SIZE
    );
    expect(area.end).toEqual({ w: 299, h: 199 });
    expect(areaSize(area).w).toBe(CLICKED_TEXT_BOX_WIDTH);
  });

  it('is never smaller than one line', () => {
    const area = getNewTextBoxArea(
      [
        { w: 20, h: 10 },
        { w: 60, h: 11 },
      ],
      OPTIONS,
      IMAGE_SIZE
    );
    expect(areaSize(area)).toEqual({ w: 41, h: getMinTextBoxSize(OPTIONS).h });
  });
});

describe('fitTextBox', () => {
  const box: TextBox = { area: areaFromStartAndSize({ w: 10, h: 10 }, { w: 60, h: 40 }), text: '' };

  it('returns the same box when it already fits', () => {
    expect(fitTextBox(box, OPTIONS, IMAGE_SIZE)).toBe(box);
  });

  it('grows the box downwards until all the lines show', () => {
    const text: string = 'a\nb\nc\nd\ne\nf';
    const fitted: TextBox = fitTextBox({ ...box, text }, OPTIONS, IMAGE_SIZE);
    expect(fitted.text).toBe(text);
    expect(fitted.area.start).toEqual(box.area.start);
    expect(areaSize(fitted.area)).toEqual({ w: 60, h: 6 * getFontMetrics(OPTIONS).lineHeight });
  });

  it('does not shrink the box when lines are deleted', () => {
    const tall: TextBox = { ...box, area: areaFromStartAndSize({ w: 10, h: 10 }, { w: 60, h: 150 }) };
    expect(fitTextBox(tall, OPTIONS, IMAGE_SIZE)).toBe(tall);
  });

  it('stops growing at the bottom of the image', () => {
    const fitted: TextBox = fitTextBox({ ...box, text: 'x\n'.repeat(50) }, OPTIONS, IMAGE_SIZE);
    expect(fitted.area.end.h).toBe(IMAGE_SIZE.h - 1);
  });

  it('keeps the box inside the image', () => {
    const outside: TextBox = { ...box, area: areaFromStartAndSize({ w: 280, h: 10 }, { w: 60, h: 40 }) };
    expect(fitTextBox(outside, OPTIONS, IMAGE_SIZE).area).toEqual(
      areaFromStartAndSize({ w: 240, h: 10 }, { w: 60, h: 40 })
    );
  });
});

describe('renderTextBox', () => {
  const size: Point = { w: 80, h: 40 };

  function render(overrides: Partial<Parameters<typeof renderTextBox>[0]> = {}): ImageData {
    return renderTextBox({ text: 'Hi', width: size.w, height: size.h, options: OPTIONS, textColor: RED, ...overrides });
  }

  it('is the size of the box', () => {
    const image: ImageData = render();
    expect([image.width, image.height]).toEqual([size.w, size.h]);
  });

  it('draws the text in the text color on a transparent background', () => {
    const image: ImageData = render();
    expect(pointsOfColor(image, RED).length).toBeGreaterThan(5);
    expect(alphaAt({ w: 79, h: 39 }, image)).toBe(0);
    const firstLine: number = getFontMetrics(OPTIONS).lineHeight;
    expect(
      pointsOfColor(image, RED).every((point) => point.h < firstLine && point.w < 40),
      'only on the first line, near the left edge'
    ).toBe(true);
  });

  it('fills the background with the background color when there is one', () => {
    const image: ImageData = render({ backgroundColor: WHITE });
    expect(isColor({ w: 79, h: 39 }, image, WHITE)).toBe(true);
    expect(alphaAt({ w: 79, h: 39 }, image)).toBe(255);
  });

  it('draws the lines one below the other', () => {
    const lineHeight: number = getFontMetrics(OPTIONS).lineHeight;
    const image: ImageData = render({ text: 'Hi\nHi', textColor: BLACK, height: 2 * lineHeight });
    const rows: number[] = pointsOfColor(image, BLACK).map((point) => point.h);
    expect(Math.min(...rows)).toBeLessThan(lineHeight);
    expect(Math.max(...rows)).toBeGreaterThanOrEqual(lineHeight);
  });

  it('underlines each line with a solid stroke below the baseline', () => {
    const { ascent } = getFontMetrics(OPTIONS);
    const plain: ImageData = render({ text: 'ab', backgroundColor: WHITE, textColor: BLACK });
    const underlined: ImageData = render({
      text: 'ab',
      backgroundColor: WHITE,
      textColor: BLACK,
      options: { ...OPTIONS, underline: true },
    });
    const underlineRow: number = ascent + Math.max(1, Math.round(pointsToPixels(OPTIONS.fontSize) / 10));
    expect(isColor({ w: 2, h: underlineRow }, plain, WHITE)).toBe(true);
    expect(isColor({ w: 2, h: underlineRow }, underlined, BLACK)).toBe(true);
    expect(isColor({ w: 70, h: underlineRow }, underlined, WHITE), 'only as wide as the text').toBe(true);
  });

  it('cuts off lines that do not fit', () => {
    const image: ImageData = render({ text: 'a\nb\nc\nd\ne\nf', height: 5 });
    expect(image.height).toBe(5);
    expect(getPixel({ w: 0, h: 4 }, image)).toBeDefined();
  });
});
