console.log("Skrypt content.js działa!");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "addTextToTextArea") {
    addTextToTextArea(request.value);
  }
});

function addTextToTextArea(value) {
  // Znajdź pole existingTextArea w aplikacji webowej i dodaj wartość
  var existingTextArea = document.getElementById("existingTextArea");
  if (existingTextArea) {
    existingTextArea.value += value;
  }
}


// MutationObserver do monitorowania zmian w drzewie DOM
var observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      var textAreas = document.querySelectorAll("[class^=styled__SAddComment]");

      textAreas.forEach(function (textArea) {
        textArea.setAttribute("genre", "commentary");
        var genre = document.querySelector("[genre]");
        var btn = document.getElementById("extension-button");
        var icon = document.createElement("i");

        if (genre && genre.children && genre.children.length < 2) {
          if (!btn) {
           


            console.log('mutation observer działa')
            btn = document.createElement("button");
            btn.setAttribute("id", "extension-button");
            var existingTextarea = genre.querySelector("textarea");
            genre.insertBefore(btn, existingTextarea.nextSibling);
            btn.appendChild(icon);
            icon.innerText = "record_voice_over";
            btn.style.paddingTop = "5px";
            btn.style.height = "35px";
            btn.style.width = "35px";
            btn.style.borderRadius = "50%";
            btn.style.display = "flex";
            btn.style.justifyContent = "center";
            btn.style.alignItems = "center";
            btn.style.marginTop = "10px";
            icon.style.width = "auto";
            icon.style.height = "auto";
            icon.style.textAlign = "center";
            icon.style.margin = "auto";
            icon.style.fontSize = "20px";

            btn.addEventListener("click", function () {
              chrome.runtime.sendMessage({ action: "TogglePopup" });
            });
          }
        }
      });
    }
  });
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}
