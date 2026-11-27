import { vi } from 'vitest';
import {
  BUNDLED_FONT,
  detectAvailableFonts,
  getPreferredFont,
  isFontAvailable,
  isLocalFontAccessGranted,
  isLocalFontAccessSupported,
  queryLocalFontFamilies,
  sortFontFamilies,
} from './font.helpers';

/** A canvas context whose text width depends only on the font, as if only the given families were installed */
function fakeContext(installed: string[]): CanvasRenderingContext2D {
  const context = {
    font: '',
    measureText(): TextMetrics {
      const family: string | undefined = installed.find((name) => context.font.includes(`"${name}"`));
      const fallback: string = context.font.split(/[\s,]+/).pop();
      return { width: family ? 100 + family.length : fallback.length } as TextMetrics;
    },
  };
  return (context as unknown) as CanvasRenderingContext2D;
}

describe('isFontAvailable', () => {
  it('is true when text in the family is wider or narrower than in the fallback fonts', () => {
    expect(isFontAvailable('Arial', fakeContext(['Arial']))).toBe(true);
  });

  it('is false when the text always falls back', () => {
    expect(isFontAvailable('Arial', fakeContext(['Verdana']))).toBe(false);
  });

  it('is false for a font that does not exist, measured for real', () => {
    expect(isFontAvailable('No Such Font 4a7c')).toBe(false);
  });
});

describe('detectAvailableFonts', () => {
  it('keeps only the installed candidates and adds the app font', () => {
    expect(detectAvailableFonts(['No Such Font 4a7c', 'Another Missing Font 9d'])).toEqual([BUNDLED_FONT]);
  });
});

describe('sortFontFamilies', () => {
  it('sorts by name without regard to case and drops duplicates', () => {
    expect(sortFontFamilies(['verdana', 'Arial', 'Comic Sans MS', 'Arial'])).toEqual([
      'Arial',
      'Comic Sans MS',
      'verdana',
    ]);
  });
});

describe('getPreferredFont', () => {
  it('picks the first preferred font that is available', () => {
    expect(getPreferredFont(['Comic Sans MS', 'Helvetica', 'Arial'])).toBe('Arial');
    expect(getPreferredFont(['Comic Sans MS', 'Liberation Sans'])).toBe('Liberation Sans');
  });

  it('falls back to the first available font, or a generic one', () => {
    expect(getPreferredFont(['Comic Sans MS'])).toBe('Comic Sans MS');
    expect(getPreferredFont([])).toBe('sans-serif');
  });
});

describe('Local Font Access', () => {
  const original: Window['queryLocalFonts'] = window.queryLocalFonts;

  function setQueryLocalFonts(query: Window['queryLocalFonts']) {
    Object.defineProperty(window, 'queryLocalFonts', { value: query, configurable: true, writable: true });
  }

  afterEach(() => {
    setQueryLocalFonts(original);
    vi.restoreAllMocks();
  });

  it('is supported only where window.queryLocalFonts exists', () => {
    setQueryLocalFonts(undefined);
    expect(isLocalFontAccessSupported()).toBe(false);
    setQueryLocalFonts(() => Promise.resolve([]));
    expect(isLocalFontAccessSupported()).toBe(true);
  });

  it('lists the families of the installed fonts once each, with the app font', async () => {
    setQueryLocalFonts(() =>
      Promise.resolve([
        { family: 'Verdana', fullName: 'Verdana', postscriptName: 'Verdana', style: 'Regular' },
        { family: 'Arial', fullName: 'Arial Bold', postscriptName: 'Arial-Bold', style: 'Bold' },
        { family: 'Arial', fullName: 'Arial', postscriptName: 'Arial', style: 'Regular' },
      ])
    );
    expect(await queryLocalFontFamilies()).toEqual(['Arial', 'Verdana', BUNDLED_FONT]);
  });

  it('is granted only when the permission says so', async () => {
    setQueryLocalFonts(undefined);
    expect(await isLocalFontAccessGranted()).toBe(false);

    setQueryLocalFonts(() => Promise.resolve([]));
    const query = vi.spyOn(navigator.permissions, 'query');
    query.mockResolvedValue({ state: 'granted' } as PermissionStatus);
    expect(await isLocalFontAccessGranted()).toBe(true);
    expect(query).toHaveBeenCalledWith({ name: 'local-fonts' });

    query.mockResolvedValue({ state: 'prompt' } as PermissionStatus);
    expect(await isLocalFontAccessGranted()).toBe(false);

    query.mockRejectedValue(new TypeError('unknown permission'));
    expect(await isLocalFontAccessGranted()).toBe(false);
  });
});
