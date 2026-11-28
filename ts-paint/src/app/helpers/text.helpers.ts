import { TextOptions } from '../types/drawing-tools/drawing-tool-options';
import { Color } from '../types/base/color';
import { Point } from '../types/base/point';
import { RectangleArea } from '../types/base/rectangle-area';
import { TextBox } from '../types/base/text-box';
import { colorToCss } from './color.helpers';
import { areaFromStartAndSize, areaSize, fitAreaInBounds, normalizeArea } from './area.helpers';

/** The width of a text box made with a click rather than a drag */
export const CLICKED_TEXT_BOX_WIDTH: number = 150;

/** CSS generic font families: they must not be quoted */
export const GENERIC_FONT_FAMILIES: string[] = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];

/** Font sizes are in points, like in MS Paint (at 96 dpi a point is 4/3 px) */
export function pointsToPixels(points: number): number {
  return (points * 96) / 72;
}

/** The font family as a CSS value, with a fallback for fonts that are missing */
export function cssFontFamily(family: string): string {
  if (GENERIC_FONT_FAMILIES.includes(family)) {
    return family;
  }
  return `"${family.replace(/["\\]/g, '\\$&')}", sans-serif`;
}

/** The CSS (and canvas) font shorthand for the options, without a line height */
export function cssFont(options: TextOptions): string {
  return [
    options.italic ? 'italic' : '',
    options.bold ? 'bold' : '',
    pointsToPixels(options.fontSize) + 'px',
    cssFontFamily(options.fontFamily),
  ]
    .filter((part) => part !== '')
    .join(' ');
}

export interface FontMetrics {
  /** Whole pixels from the top of a line to the baseline */
  ascent: number;
  /** Whole pixels from the baseline to the bottom of a line */
  descent: number;
  /** The height of a line: ascent + descent. Used as the CSS line height, so that each line of the text box starts on
   * a whole pixel and its baseline is exactly `ascent` pixels below that */
  lineHeight: number;
}

let measuringCanvas: HTMLCanvasElement;

function measuringContext(): CanvasRenderingContext2D {
  measuringCanvas = measuringCanvas ?? document.createElement('canvas');
  return measuringCanvas.getContext('2d');
}

export function getFontMetrics(options: TextOptions): FontMetrics {
  const context: CanvasRenderingContext2D = measuringContext();
  context.font = cssFont(options);
  const metrics: TextMetrics = context.measureText('Mg');
  // Like the browser's own line layout, round the font's ascent and descent separately
  const ascent: number = Math.round(metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent);
  const descent: number = Math.round(metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent);
  return { ascent, descent, lineHeight: Math.max(1, ascent + descent) };
}

/**
 * The styles that decide where the text of a box wraps. The text box's textarea and the hidden copy that layoutText
 * measures both get them, so the text is drawn with exactly the line breaks the user sees while typing.
 */
export function getTextLayoutStyles(options: TextOptions, width: number): Record<string, string> {
  return {
    font: cssFont(options),
    lineHeight: getFontMetrics(options).lineHeight + 'px',
    width: width + 'px',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    letterSpacing: 'normal',
    wordSpacing: 'normal',
    textTransform: 'none',
    textIndent: '0',
    textAlign: 'left',
    direction: 'ltr',
    padding: '0',
    border: '0',
    margin: '0',
    boxSizing: 'content-box',
  };
}

export interface TextLayout {
  /** The visual lines, after wrapping */
  lines: string[];
  lineHeight: number;
  ascent: number;
  /** The height that shows every line */
  height: number;
}

/** Splits the text into the lines a box of the given width shows. Line breaks are found by the browser, in a hidden
 * element with the same styles as the textarea. */
export function layoutText(text: string, options: TextOptions, width: number): TextLayout {
  const metrics: FontMetrics = getFontMetrics(options);
  const mirror: HTMLDivElement = document.createElement('div');
  Object.assign(mirror.style, getTextLayoutStyles(options, width), {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    left: '0',
    top: '0',
  });
  // Under the body, so that it gets the same CSS zoom as the text box (see PixelScalingService)
  document.body.appendChild(mirror);
  try {
    // Client rects are in zoomed pixels, line heights in layout pixels
    const scale: number = width > 0 ? mirror.getBoundingClientRect().width / width : 1;
    const lines: string[] = text
      .split('\n')
      .flatMap((hardLine) => splitIntoVisualLines(mirror, hardLine, (metrics.lineHeight * scale) / 2));
    return {
      lines,
      lineHeight: metrics.lineHeight,
      ascent: metrics.ascent,
      height: lines.length * metrics.lineHeight,
    };
  } finally {
    mirror.remove();
  }
}

/** The lines one paragraph wraps into: a new line starts at each character that lies lower than the one before it */
function splitIntoVisualLines(mirror: HTMLElement, paragraph: string, threshold: number): string[] {
  if (paragraph === '') {
    return [''];
  }
  const block: HTMLDivElement = document.createElement('div');
  block.textContent = paragraph;
  mirror.appendChild(block);
  const node: Text = block.firstChild as Text;
  const range: Range = document.createRange();
  const lines: string[] = [];
  let lineStart: number = 0;
  let lineTop: number;
  let index: number = 0;
  for (const character of paragraph) {
    range.setStart(node, index);
    range.setEnd(node, index + character.length);
    const rects: DOMRectList = range.getClientRects();
    if (rects.length > 0) {
      const top: number = rects[0].top;
      if (lineTop === undefined) {
        lineTop = top;
      } else if (top > lineTop + threshold) {
        lines.push(paragraph.slice(lineStart, index));
        lineStart = index;
        lineTop = top;
      }
    }
    index += character.length;
  }
  lines.push(paragraph.slice(lineStart));
  block.remove();
  return lines;
}

/** A text box is at least one line high and about one character wide */
export function getMinTextBoxSize(options: TextOptions): Point {
  const lineHeight: number = getFontMetrics(options).lineHeight;
  return { w: lineHeight, h: lineHeight };
}

/** The area of a new text box dragged from one corner to the other; a click (or a tiny drag) gives a box of the
 * default width */
export function getNewTextBoxArea(corners: [Point, Point], options: TextOptions, imageSize: Point): RectangleArea {
  const area: RectangleArea = normalizeArea({ start: corners[0], end: corners[1] });
  const size: Point = areaSize(area);
  const isClick: boolean = size.w <= 2 && size.h <= 2;
  const requested: RectangleArea = isClick
    ? areaFromStartAndSize(area.start, { w: CLICKED_TEXT_BOX_WIDTH, h: 1 })
    : area;
  return fitAreaInBounds(requested, getMinTextBoxSize(options), imageSize);
}

/**
 * Keeps the text box inside the image and at least its minimum size, and grows it downwards until all of its lines
 * show, up to the bottom of the image (MS Paint does not shrink a box when text is deleted, and neither does this).
 */
export function fitTextBox(textBox: TextBox, options: TextOptions, imageSize: Point): TextBox {
  let area: RectangleArea = fitAreaInBounds(textBox.area, getMinTextBoxSize(options), imageSize);
  const neededHeight: number = layoutText(textBox.text, options, areaSize(area).w).height;
  if (neededHeight > areaSize(area).h) {
    const bottom: number = Math.min(imageSize.h - 1, area.start.h + neededHeight - 1);
    area = { start: area.start, end: { w: area.end.w, h: bottom } };
  }
  return areasEqual(area, textBox.area) ? textBox : { ...textBox, area };
}

function areasEqual(a: RectangleArea, b: RectangleArea): boolean {
  return a.start.w === b.start.w && a.start.h === b.start.h && a.end.w === b.end.w && a.end.h === b.end.h;
}

export interface TextBoxRendering {
  text: string;
  width: number;
  height: number;
  options: TextOptions;
  textColor: Color;
  /** Fills the box first (Draw Opaque); without it the background stays transparent */
  backgroundColor?: Color;
}

/** The text box as an image: what the user sees while typing, and what gets pasted into the picture */
export function renderTextBox(rendering: TextBoxRendering): ImageData {
  const { text, width, height, options, textColor, backgroundColor } = rendering;
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context: CanvasRenderingContext2D = canvas.getContext('2d', { willReadFrequently: true });
  if (backgroundColor !== undefined) {
    context.fillStyle = colorToCss(backgroundColor);
    context.fillRect(0, 0, width, height);
  }
  const layout: TextLayout = layoutText(text, options, width);
  const fontSize: number = pointsToPixels(options.fontSize);
  const underlineOffset: number = Math.max(1, Math.round(fontSize / 10));
  const underlineThickness: number = Math.max(1, Math.round(fontSize / 14));
  context.font = cssFont(options);
  context.fillStyle = colorToCss(textColor);
  context.textBaseline = 'alphabetic';
  layout.lines.forEach((line, index) => {
    const baseline: number = index * layout.lineHeight + layout.ascent;
    context.fillText(line, 0, baseline);
    if (options.underline) {
      const lineWidth: number = Math.round(context.measureText(line.trimEnd()).width);
      context.fillRect(0, baseline + underlineOffset, lineWidth, underlineThickness);
    }
  });
  return context.getImageData(0, 0, width, height);
}
