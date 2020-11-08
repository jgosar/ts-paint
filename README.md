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

## Chrome extension
As a fun exercise, I have also implemented an extension for Google Chrome.
It adds the option 'Edit in TS Paint' to the context menu when you right-click on an image on any website, which loads the image into TS Paint in a new tab.
To install the extension, follow these steps:
- Go to chrome://extensions
- In the upper right corner enable **Developer mode**
- In the upper left corner, click **Load unpacked**
- In the directory picker, select the `ts-paint\ts-paint-chrome-extension` directory

## Future plans

### Immediate TODO list
- Eraser tool
- Add option of using different line thicknesses
- Text tool
- Options/Edit Colors window, include some extra modern features, like HSL colors and hex color codes
- File/Save as window (Changing save location is not possible, but I can add the options of renaming the file or saving it as a JPG)
- Use the _File System Access API_ to overwrite files directly, instead of saving changes to a new downloaded file
- Image/Draw Opaque option
- View/Zoom/Show Grid option

### Nice to have
- Different mouse cursors for different drawing tools
- Polygon tool
- Curve tool
- Brush tool
- Airbrush tool
- View/View Bitmap option
- File/Print (Possibility of printing the image without the UI)

### Planned features that are not part of the original MS Paint
- CSS Filter color effects (hue-rotate, brightness, contrast, etc.)
- Transparency
- Clipboard manager
- Editing history window + Export/import editing steps to/from JSON
- Layers?
