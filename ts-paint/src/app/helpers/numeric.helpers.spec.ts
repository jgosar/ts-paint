import { validateMinMax } from './numeric.helpers';

describe('validateMinMax', () => {
  it('accepts values inside the range, including the bounds', () => {
    expect(validateMinMax(5, 1, 10)).toBe(true);
    expect(validateMinMax(1, 1, 10)).toBe(true);
    expect(validateMinMax(10, 1, 10)).toBe(true);
  });

  it('rejects values below the minimum', () => {
    expect(validateMinMax(0, 1, 10)).toBe(false);
    expect(validateMinMax(-5, 1, 10)).toBe(false);
  });

  it('rejects values above the maximum', () => {
    expect(validateMinMax(11, 1, 10)).toBe(false);
  });

  it('enforces a minimum of 0', () => {
    expect(validateMinMax(-5, 0, 10)).toBe(false);
    expect(validateMinMax(0, 0, 10)).toBe(true);
    expect(validateMinMax(5, 0, 10)).toBe(true);
  });

  it('enforces a maximum of 0', () => {
    expect(validateMinMax(500, -10, 0)).toBe(false);
    expect(validateMinMax(0, -10, 0)).toBe(true);
    expect(validateMinMax(-5, -10, 0)).toBe(true);
  });

  it('treats undefined and null bounds as no limit', () => {
    expect(validateMinMax(-500, undefined, undefined)).toBe(true);
    expect(validateMinMax(500, undefined, undefined)).toBe(true);
    expect(validateMinMax(-500, null, null)).toBe(true);
    expect(validateMinMax(500, null, null)).toBe(true);
  });

  it('accepts NaN regardless of the bounds', () => {
    expect(validateMinMax(NaN, 1, 10)).toBe(true);
  });
});
