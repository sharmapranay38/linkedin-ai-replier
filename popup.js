document.getElementById("saveKey").addEventListener("click", () => {
    const key = document.getElementById("apiKey").value;
    chrome.storage.sync.set({ geminiKey: key }, () => {
      document.getElementById("status").textContent = "✅ Saved!";
    });
  });
  