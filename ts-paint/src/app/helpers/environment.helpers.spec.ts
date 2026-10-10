import { vi } from 'vitest';
import { getOsVersion, reloadPage } from './environment.helpers';

describe('getOsVersion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function withUserAgent(userAgent: string): string | undefined {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    return getOsVersion();
  }

  const cases: { name: string; userAgent: string; expected: string | undefined }[] = [
    {
      name: 'Windows 10 (matched before the generic Windows NT entry)',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
      expected: 'Windows 10',
    },
    {
      name: 'Windows 7',
      userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36',
      expected: 'Windows 7',
    },
    {
      name: 'an unknown Windows NT version falls back to Windows NT 4.0',
      userAgent: 'Mozilla/5.0 (Windows NT 11.5) AppleWebKit/537.36',
      expected: 'Windows NT 4.0',
    },
    {
      name: 'macOS',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
      expected: 'Mac OS X',
    },
    {
      name: 'a Mac without the OS X version string',
      userAgent: 'Mozilla/5.0 (Macintosh; PPC) Netscape',
      expected: 'Mac OS',
    },
    {
      name: 'Linux',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0',
      expected: 'Linux',
    },
    {
      name: 'Chrome OS (matched before Linux)',
      userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36',
      expected: 'Chrome OS',
    },
    {
      name: 'Android (matched before Linux)',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile Safari/537.36',
      expected: 'Android',
    },
    {
      name: 'iPhone',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      expected: 'iOS',
    },
    {
      name: 'iPad',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      expected: 'iOS',
    },
    {
      name: 'a search bot',
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      expected: 'Search Bot',
    },
    {
      name: 'an unknown user agent',
      userAgent: 'SomethingElse/1.0',
      expected: undefined,
    },
  ];

  cases.forEach(({ name, userAgent, expected }) => {
    it(`recognises ${name}`, () => {
      expect(withUserAgent(userAgent)).toBe(expected);
    });
  });
});

describe('reloadPage', () => {
  // Not called: it would reload the test page
  it('is an exported function', () => {
    expect(typeof reloadPage).toBe('function');
  });
});
