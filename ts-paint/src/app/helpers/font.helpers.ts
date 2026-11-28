/**
 * Fonts for the text tool. Browsers do not list the installed fonts, so a list of well-known families is checked for
 * the ones that are present. Where the Local Font Access API exists (Chromium on desktop), the user can allow the
 * app to list every installed font instead.
 */

/** The pixel font of the app's own UI; always there */
export const BUNDLED_FONT: string = 'Windows95';

/** Well-known font families of Windows, macOS, Linux, Android and iOS */
export const CANDIDATE_FONTS: string[] = [
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Avenir',
  'Avenir Next',
  'Baskerville',
  'Book Antiqua',
  'Bookman Old Style',
  'Calibri',
  'Cambria',
  'Candara',
  'Cantarell',
  'Century Gothic',
  'Comic Sans MS',
  'Consolas',
  'Constantia',
  'Corbel',
  'Courier',
  'Courier New',
  'DejaVu Sans',
  'DejaVu Sans Mono',
  'DejaVu Serif',
  'Didot',
  'Droid Sans',
  'Droid Serif',
  'Ebrima',
  'Franklin Gothic Medium',
  'Futura',
  'Gabriola',
  'Gadugi',
  'Garamond',
  'Geneva',
  'Georgia',
  'Gill Sans',
  'Helvetica',
  'Helvetica Neue',
  'Hoefler Text',
  'Impact',
  'Ink Free',
  'Liberation Mono',
  'Liberation Sans',
  'Liberation Serif',
  'Lucida Console',
  'Lucida Grande',
  'Lucida Sans Unicode',
  'Marker Felt',
  'Menlo',
  'Microsoft Sans Serif',
  'Monaco',
  'MS Gothic',
  'MV Boli',
  'Noto Sans',
  'Noto Serif',
  'Noto Sans Mono',
  'Optima',
  'Palatino',
  'Palatino Linotype',
  'Papyrus',
  'Roboto',
  'Roboto Mono',
  'Segoe Print',
  'Segoe Script',
  'Segoe UI',
  'SF Pro',
  'Sitka Text',
  'Sylfaen',
  'Symbol',
  'Tahoma',
  'Times',
  'Times New Roman',
  'Trebuchet MS',
  'Ubuntu',
  'Ubuntu Mono',
  'Verdana',
  'Webdings',
  'Wingdings',
];

/** The default family and the ones to fall back to, in order, when the default is missing */
export const PREFERRED_FONTS: string[] = [
  'Arial',
  'Helvetica',
  'Liberation Sans',
  'Roboto',
  'DejaVu Sans',
  'sans-serif',
];

/** Text that differs in width between most fonts */
const PROBE_TEXT: string = 'mmmmmmmmmmlliWQ@#0Oo';
const FALLBACKS: string[] = ['monospace', 'serif', 'sans-serif'];

/** True when text in the family is drawn with another font than in each of the generic fallback fonts */
export function isFontAvailable(family: string, context: CanvasRenderingContext2D = createContext()): boolean {
  const quoted: string = `"${family.replace(/["\\]/g, '\\$&')}"`;
  return FALLBACKS.some((fallback) => {
    context.font = `72px ${fallback}`;
    const fallbackWidth: number = context.measureText(PROBE_TEXT).width;
    context.font = `72px ${quoted}, ${fallback}`;
    return context.measureText(PROBE_TEXT).width !== fallbackWidth;
  });
}

/** The candidates that are installed, plus the app's own font, sorted by name */
export function detectAvailableFonts(candidates: string[] = CANDIDATE_FONTS): string[] {
  const context: CanvasRenderingContext2D = createContext();
  const available: string[] = candidates.filter((family) => isFontAvailable(family, context));
  return sortFontFamilies([...available, BUNDLED_FONT]);
}

/** The first of the preferred fonts that is available */
export function getPreferredFont(available: string[]): string {
  return PREFERRED_FONTS.find((family) => available.includes(family)) ?? available[0] ?? 'sans-serif';
}

export function sortFontFamilies(families: string[]): string[] {
  return [...new Set(families)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function isLocalFontAccessSupported(): boolean {
  return typeof window.queryLocalFonts === 'function';
}

/** True when the user has already allowed the app to list the installed fonts, so it can do so without asking */
export async function isLocalFontAccessGranted(): Promise<boolean> {
  if (!isLocalFontAccessSupported()) {
    return false;
  }
  try {
    const status: PermissionStatus = await navigator.permissions.query({ name: 'local-fonts' as PermissionName });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

/** Every installed font family, sorted by name. Asks for permission the first time; rejects when it is refused. */
export async function queryLocalFontFamilies(): Promise<string[]> {
  const fonts: LocalFontData[] = await window.queryLocalFonts();
  return sortFontFamilies([...fonts.map((font) => font.family), BUNDLED_FONT]);
}

function createContext(): CanvasRenderingContext2D {
  return document.createElement('canvas').getContext('2d');
}
