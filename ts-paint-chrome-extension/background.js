const TS_PAINT_MENU_ID = 'TS_PAINT_MENU';
const TS_PAINT_URL = 'https://jgosar.github.io/ts-paint/';

// The service worker is restarted on demand, so the menu item is created once on install
// rather than at the top level, where it would fail with a duplicate id on every restart.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: TS_PAINT_MENU_ID, title: 'Edit in TS Paint', contexts: ['image'] });
});

// Registered synchronously at the top level so Chrome can wake the worker for the click.
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== TS_PAINT_MENU_ID) {
    return;
  }
  chrome.tabs.create({ url: TS_PAINT_URL + '?imageUrl=' + encodeURIComponent(info.srcUrl) });
});
