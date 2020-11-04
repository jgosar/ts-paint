const TS_PAINT_MENU_ID = "TS_PAINT_MENU";
function openImage(info,tab) {
  if (info.menuItemId !== TS_PAINT_MENU_ID) {
    return;
  }
  chrome.tabs.create({  
    url: "https://jgosar.github.io/ts-paint/?imageUrl=" + encodeURIComponent(info.srcUrl)
  });
}
chrome.contextMenus.create({
  title: "Edit in TS Paint", 
  contexts:["image"], 
  id: TS_PAINT_MENU_ID
});
chrome.contextMenus.onClicked.addListener(openImage);
