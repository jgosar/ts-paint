import { assertUnreachable, isDefined, isEmpty, lastElement, max, min, recordKeys } from './typescript.helpers';

describe('assertUnreachable', () => {
  it('does nothing at runtime', () => {
    expect(assertUnreachable('surprise' as never)).toBeUndefined();
  });
});

describe('recordKeys', () => {
  it('returns the keys of the record', () => {
    expect(recordKeys({ a: 1, b: 2 })).toEqual(['a', 'b']);
  });

  it('is empty for an empty record', () => {
    expect(recordKeys({})).toEqual([]);
  });
});

describe('isDefined', () => {
  it('is false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it('is true for other falsy values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined(NaN)).toBe(true);
  });

  it('is true for objects', () => {
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
  });
});

describe('isEmpty', () => {
  it('is true for null, undefined and an empty array', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty([])).toBe(true);
  });

  it('is false for an array with elements', () => {
    expect(isEmpty([0])).toBe(false);
    expect(isEmpty([undefined])).toBe(false);
  });
});

describe('lastElement', () => {
  it('returns the last element', () => {
    expect(lastElement([1, 2, 3])).toBe(3);
    expect(lastElement(['only'])).toBe('only');
  });

  it('is undefined for an empty or missing array', () => {
    expect(lastElement([])).toBeUndefined();
    expect(lastElement(undefined)).toBeUndefined();
    expect(lastElement(null)).toBeUndefined();
  });
});

describe('min', () => {
  it('returns the smallest number', () => {
    expect(min([3, -1, 2])).toBe(-1);
    expect(min([5])).toBe(5);
  });

  it('is undefined for an empty array', () => {
    expect(min([])).toBeUndefined();
  });
});

describe('max', () => {
  it('returns the largest number', () => {
    expect(max([3, -1, 2])).toBe(3);
    expect(max([5])).toBe(5);
  });

  it('is undefined for an empty array', () => {
    expect(max([])).toBeUndefined();
  });
});
