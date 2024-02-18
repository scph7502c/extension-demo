import { pageElements, showInfo } from "./modules/page-elements.mjs";
import {
  populateWithLanguageOptions,
  createLanguageHandler,
} from "./modules/input-laguages.mjs";
import { inputLanguages } from "./modules/config.mjs";
import {
  recognitionStart,
  recognitionStop,
  registerRecognitionCallbacks,
} from "./modules/voice-input-arbitrary.mjs";


populateWithLanguageOptions(pageElements["select_language"]);
const updateDialect = createLanguageHandler(
  pageElements["select_language"],
  pageElements["select_dialect"]
);
updateDialect(
  inputLanguages
    .map((languageDialectsSet) => languageDialectsSet[0])
    .indexOf("English"),
  0
);

pageElements["select_language"].addEventListener("change", function () {
  updateDialect(this.selectedIndex);
});
showInfo("info-start");

if (!("webkitSpeechRecognition" in window)) {
  showInfo("info_upgrade");
} else {
  registerRecognitionCallbacks();
  ["input1", "input2"].forEach((inputId) => {
    pageElements[inputId].addEventListener("focus", recognitionStart);
    pageElements[inputId].addEventListener("blur", recognitionStop);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var addButton = document.getElementById("add");

  addButton.addEventListener("click", function () {
    var input2Value = document.getElementById("input2").value;

    // Sprawdź, czy wartość input2Value nie jest pusta przed wysłaniem wiadomości
    if (input2Value.trim() !== "") {
      // Wysłanie wiadomości do skryptu zawartości
      chrome.runtime.sendMessage({ action: "addTextToTextArea", value: input2Value });
    } else {
      console.log("Wartość input2Value jest pusta.");
    }
  });
});

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
  }
});

chrome.action.onClicked.addListener(function (tab) {
  chrome.runtime.sendMessage({ action: "TogglePopup" });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addTextToTextArea") {
    var input2Value = request.value;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "addTextToTextArea", value: input2Value });
    });
  }
});
