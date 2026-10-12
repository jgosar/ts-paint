# TS Paint
A rewrite of MS Paint for Windows 95 in Typescript and Angular

Screenshot:

![](https://raw.githubusercontent.com/jgosar/ts-paint/master/screens/ts-paint.png)

Live version:

https://jgosar.github.io/ts-paint/

The project is still at an early stage of development, but the general roadmap is:
- Implement all the features of Microsoft Paint for Windows 95
- Add unit tests for everything
- Add lots of new features that MS Paint did not support (the sky is the limit)

## Install as an app
TS Paint is a Progressive Web App. Open the live version in a browser that supports installing web apps (Chrome, Edge, Safari) and use the browser's install option to add it to your desktop or home screen. Once installed it works offline, and new versions are picked up automatically the next time you launch it.

In Chromium-based browsers the installed app also registers as a handler for image files, so you can right-click a `.png`, `.jpg`, `.gif`, `.bmp` or `.webp` file and choose **Open with TS Paint**. Files opened this way (or via File > Open, or by dragging them into the window) are saved back in place with File > Save.

The UI always renders with a whole number of device pixels per CSS pixel. Fractional OS display scaling (such as 125% or 150% on Windows) is snapped to the nearest integer, so the Windows 95 look stays pixel-perfect on high-DPI screens. Browser zoom (Ctrl +/-) is snapped to integer steps as well.

## Testing
Everything below runs from the `ts-paint` directory.

Unit tests use Vitest in browser mode, running in a real Chromium (the app draws on canvases, which jsdom cannot do):

```sh
npm test            # watch mode
npm run test:ci     # single run with coverage
```

End-to-end and visual tests use Playwright against the production build:

```sh
npx playwright install --with-deps chromium   # once
npm run test:e2e                              # functional tests, natively
npm run test:e2e:docker                       # functional + visual tests in the pinned Playwright Docker image
npm run test:e2e:update                       # regenerate the visual baselines (Docker only)
```

The visual baselines are exact-match screenshots generated only on Linux inside Docker; never commit snapshots taken on macOS or Windows. See [ts-paint/e2e/README.md](ts-paint/e2e/README.md) for the details and conventions. Every pull request runs lint, unit and e2e tests, and the GitHub Pages deploy only runs after they pass on `master`.

## Chrome extension
As a fun exercise, I have also implemented an extension for Google Chrome. It uses Manifest V3, so it works in current versions of Chrome.
It adds the option 'Edit in TS Paint' to the context menu when you right-click on an image on any website, which loads the image into TS Paint in a new tab.
To install the extension, follow these steps:
- Go to chrome://extensions
- In the upper right corner enable **Developer mode**
- In the upper left corner, click **Load unpacked**
- In the directory picker, select the `ts-paint\ts-paint-chrome-extension` directory

## Future plans

### Immediate TODO list
- Text tool
- Options/Edit Colors window, include some extra modern features, like HSL colors and hex color codes
- Image/Draw Opaque option
- View/Zoom/Show Grid option

### Nice to have
- Different mouse cursors for different drawing tools
- Polygon tool
- Curve tool
- Airbrush tool
- View/View Bitmap option
- File/Print (Possibility of printing the image without the UI)

### Planned features that are not part of the original MS Paint
- CSS Filter color effects (hue-rotate, brightness, contrast, etc.)
- Transparency
- Clipboard manager
- Editing history window + Export/import editing steps to/from JSON
- Layers?
