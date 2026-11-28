// Minimal ambient declarations for the Local Font Access API (Chromium on desktop only).

interface LocalFontData {
  readonly family: string;
  readonly fullName: string;
  readonly postscriptName: string;
  readonly style: string;
}

interface Window {
  queryLocalFonts?(options?: { postscriptNames?: string[] }): Promise<LocalFontData[]>;
}
