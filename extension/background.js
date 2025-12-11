const BACKEND_URL = 'https://li-comments.onrender.com';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateLinkedInReply',
    title: 'Generate LLM reply',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generateLinkedInReply' && info.selectionText && tab?.id) {
    // Inject content script if not already present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['contentScript.js'],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles.css'],
      });
    } catch (e) {
      // Script may already be injected, ignore error
    }

    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_REPLY_DIALOG',
      selectedText: info.selectionText,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CALL_LLM') {
    const { selectedText, responseType, userPrompt } = message.payload;

    fetch(`${BACKEND_URL}/generate-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedText, responseType, userPrompt }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || `HTTP ${response.status}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        sendResponse({ success: true, reply: data.reply });
      })
      .catch((error) => {
        console.error('Error calling backend:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
