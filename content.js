const injectButtons = () => {
    const comments = document.querySelectorAll('[data-id*="comment"]');
    comments.forEach(comment => {
      if (comment.querySelector(".ai-reply-btn")) return;
  
      const btn = document.createElement("button");
      btn.textContent = "💬 AI Reply";
      btn.className = "ai-reply-btn";
      btn.style.cssText = "margin-left:10px; background:#0073b1; color:white; border:none; padding:5px 10px; cursor:pointer;";
  
      btn.onclick = async () => {
        const commentText = comment.innerText;
  
        chrome.storage.sync.get("geminiKey", async ({ geminiKey }) => {
          if (!geminiKey) {
            alert("Please set your Gemini API key in the extension popup.");
            return;
          }
  
          const body = {
            contents: [
              { parts: [{ text: `Reply to this LinkedIn comment professionally and helpfully: "${commentText}"` }] }
            ]
          };
  
          const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + geminiKey, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
  
          const data = await response.json();
          const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!aiReply) {
            alert("No reply generated. Try again.");
            return;
          }
  
          prompt("AI Suggested Reply (copy and paste manually):", aiReply);
        });
      };
  
      comment.appendChild(btn);
    });
  };
  
  const observer = new MutationObserver(injectButtons);
  observer.observe(document.body, { childList: true, subtree: true });
  