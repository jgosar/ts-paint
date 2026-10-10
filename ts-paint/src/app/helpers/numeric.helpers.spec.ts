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

  it('treats a minimum of 0 as "no lower limit"', () => {
    // Quirk: 0 is falsy, so a minimum of 0 does not reject negative numbers
    expect(validateMinMax(-5, 0, 10)).toBe(true);
  });

  it('treats a maximum of 0 as "no upper limit"', () => {
    // Quirk: 0 is falsy, so a maximum of 0 does not reject positive numbers
    expect(validateMinMax(500, 1, 0)).toBe(true);
  });

  it('treats undefined bounds as no limit', () => {
    expect(validateMinMax(-500, undefined, undefined)).toBe(true);
    expect(validateMinMax(500, undefined, undefined)).toBe(true);
  });

  it('accepts NaN regardless of the bounds', () => {
    expect(validateMinMax(NaN, 1, 10)).toBe(true);
  });
});
