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
