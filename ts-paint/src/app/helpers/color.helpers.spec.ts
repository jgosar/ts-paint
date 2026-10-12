import { colorToCss } from './color.helpers';

describe('colorToCss', () => {
  it('formats a color as a css rgb() string', () => {
    expect(colorToCss({ r: 0, g: 0, b: 0 })).toBe('rgb(0,0,0)');
    expect(colorToCss({ r: 1, g: 2, b: 3 })).toBe('rgb(1,2,3)');
  });
});
