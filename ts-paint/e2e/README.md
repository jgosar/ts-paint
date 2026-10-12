# End-to-end and visual tests

Playwright tests that run against the production build (`npm run build`, served from `dist/ts-paint/browser` on port 4173). The functional specs assert on the actual image pixels; the visual specs compare screenshots of the UI with committed baselines.

## Layout

```
playwright.config.ts        two projects, see below; starts the web server itself
e2e/
  pages/paint.page.ts       PaintPage page object: toolbox, palette, canvas drags, menus, dialogs
  helpers/pixels.ts         read the image canvas back (imagePixel, imageMask, expectPixel)
  helpers/files.ts          fakes for the File System Access API and window.launchQueue, paste/drop helpers
  fixtures/png.ts           tiny PNG encoder (no dependencies) for generated test images
  fonts.conf                fontconfig for Docker / CI: monochrome text rendering
  *.spec.ts                 functional tests (project "chromium")
  *.visual.spec.ts          screenshot tests (project "chromium-visual")
  *-snapshots/              committed Linux baselines for the visual tests
```

## Two projects

| Project           | Files               | Runs where                                                |
| ----------------- | ------------------- | --------------------------------------------------------- |
| `chromium`        | `*.spec.ts`         | natively (`npm run test:e2e`) and in Docker / CI          |
| `chromium-visual` | `*.visual.spec.ts`  | only in Docker / CI (`npm run test:e2e:docker`)           |

```sh
npx playwright install --with-deps chromium   # once, for native runs
npm run test:e2e                              # functional tests, native Chromium
npm run test:e2e:docker                       # the whole suite in the pinned Playwright image (what CI runs)
npm run test:e2e:update                       # regenerate the visual baselines in Docker
npm run test:e2e:docker -- toolbox.visual.spec.ts --grep eraser   # a subset
```

## Visual baselines are Linux-only

Screenshots are compared exactly (`maxDiffPixels: 0`): the UI is pixel art, so a single wrong pixel is a regression. Font rasterisation differs between operating systems, therefore the baselines are generated and checked **only** inside `mcr.microsoft.com/playwright:v1.58.2-noble`, the same image the CI jobs run in. `scripts/e2e-docker.sh` runs it with `--platform linux/amd64`, so results are identical on Apple Silicon (under emulation) and on the GitHub runners.

Text is rendered without anti-aliasing (`FONTCONFIG_FILE` points at `e2e/fonts.conf`): the app's pixel font sits exactly on the pixel grid at 8px, and the Linux defaults would otherwise smear it with subpixel anti-aliasing. The visual project renders at **device scale 2** with device-pixel screenshots, the same scale as the original Paint screenshots the UI is modelled on. That also matters for the text: Chromium centres labels on half CSS pixels when the free space is odd, and without anti-aliasing a glyph on a half pixel loses parts of its strokes, while on a whole device pixel it stays intact. The result is the bitmap text of the original Paint, at 2x. `lowdpi.visual.spec.ts` keeps one screenshot of the scale 1 path.

Rules:

- Never run the `chromium-visual` project natively and never commit `*-darwin.png` or `*-win32.png` snapshots. Only `*-chromium-visual-linux.png` files belong in `*-snapshots/`.
- When a UI change is intentional, run `npm run test:e2e:update`, review the changed PNGs in the diff, and commit them together with the change.
- The image tag in `scripts/e2e-docker.sh`, in `.github/workflows/test.yml`, and the `@playwright/test` / `playwright` versions in `package.json` must all stay in sync (both npm packages are pinned without a caret).

## Conventions

- Select elements by the app's own class names (`.tsp-*`), ARIA roles or visible text. Toolbox buttons are addressed by position in `ALL_DRAWING_TOOL_TYPES`, imported from `src/`, so a reordering in the app is a reordering in the tests.
- Import real enums and config from `src/` (`DrawingToolType`, `MENU_STRUCTURE`, ...) instead of duplicating values.
- Assert on image pixels through `helpers/pixels.ts` rather than on screenshots whenever a pixel assertion expresses the behaviour; keep `toHaveScreenshot` for the UI chrome.
- Browser APIs the app depends on but a test cannot drive (file pickers, `launchQueue`, downloads) are faked with `page.addInitScript` from `helpers/files.ts`. Init scripts apply from the next navigation, so install them before `paint.goto()`.
- Chromium quirks worth knowing: Ctrl+N is reserved by the browser (use the File menu), `window.launchQueue` is a read-only native property (the fake uses `Object.defineProperty`), and dialog host elements have no box of their own (target `.tsp-modal-window__container`).
