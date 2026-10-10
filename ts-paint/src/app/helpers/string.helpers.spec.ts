import { replaceStringBetweenIndexes } from './string.helpers';

describe('replaceStringBetweenIndexes', () => {
  it('replaces the characters between the indexes', () => {
    expect(replaceStringBetweenIndexes('hello world', 6, 11, 'there')).toBe('hello there');
  });

  it('inserts at the start index when start and end are equal', () => {
    expect(replaceStringBetweenIndexes('hello', 2, 2, 'XX')).toBe('heXXllo');
  });

  it('deletes when the inserted value is empty', () => {
    expect(replaceStringBetweenIndexes('hello', 1, 3, '')).toBe('hlo');
  });

  it('returns the inserted value when the current value is empty, null or undefined', () => {
    expect(replaceStringBetweenIndexes('', 0, 0, 'new')).toBe('new');
    expect(replaceStringBetweenIndexes(null, 3, 5, 'new')).toBe('new');
    expect(replaceStringBetweenIndexes(undefined, 3, 5, 'new')).toBe('new');
  });

  it('clamps a negative or missing start index to 0', () => {
    expect(replaceStringBetweenIndexes('hello', -3, 2, 'J')).toBe('Jllo');
    expect(replaceStringBetweenIndexes('hello', undefined, 2, 'J')).toBe('Jllo');
  });

  it('clamps a too large or missing end index to the string length', () => {
    expect(replaceStringBetweenIndexes('hello', 3, 99, '!')).toBe('hel!');
    expect(replaceStringBetweenIndexes('hello', 3, undefined, '!')).toBe('hel!');
  });

  it('returns the string unchanged for an invalid range', () => {
    expect(replaceStringBetweenIndexes('hello', 3, 1, 'X')).toBe('hello');
    expect(replaceStringBetweenIndexes('hello', 6, 7, 'X')).toBe('hello');
    expect(replaceStringBetweenIndexes('hello', 0, -1, 'X')).toBe('hello');
  });

  it('appends when both indexes equal the length', () => {
    expect(replaceStringBetweenIndexes('hello', 5, 5, '!')).toBe('hello!');
  });
});
