let popupWindowId = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "TogglePopup") {
    try {
      if (popupWindowId) {
        chrome.windows.remove(popupWindowId, function () {
          popupWindowId = null;
          console.log("Extension popup closed!");
        });
      } else {
        chrome.windows.create(
          {
            url: "main_extension.html",
            type: "popup",
            focused: true,
            width: 400,
            height: 700,
            top: 0,
          },
          (window) => {
            popupWindowId = window.id;
            console.log("Extension popup opened!");
          }
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  } else if (request.action === "addTextToTextArea") {
    
    var input2Value = request.value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "addTextToTextArea", value: input2Value });
    });
  }
});

chrome.action.onClicked.addListener(function (tab) {
  chrome.runtime.sendMessage({ action: "TogglePopup" });
});
