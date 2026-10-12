import { Color } from '../types/base/color';

/** The color as a CSS rgb() value */
export function colorToCss(color: Color): string {
  return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}
