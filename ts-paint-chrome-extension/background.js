const CONTEXT_MENU_ID = "MY_CONTEXT_MENU";
function openImage(info,tab) {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return;
  }
  console.log("Image was clicked.");
  console.log(info);
  chrome.tabs.create({  
    url: "https://jgosar.github.io/ts-paint/?imageUrl=" + encodeURIComponent(info.srcUrl)
  });
}
chrome.contextMenus.create({
  title: "Edit in TS Paint", 
  contexts:["image"], 
  id: CONTEXT_MENU_ID
});
chrome.contextMenus.onClicked.addListener(openImage);
