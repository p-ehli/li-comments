const RESPONSE_TYPES = [
  { value: 'cheerleader', label: 'Cheerleader (Big Fan)' },
  { value: 'gentle_critic', label: 'Gentle Critic (Friendly Pushback)' },
  { value: 'thoughtful_peer', label: 'Thoughtful Peer (Adds Depth)' },
  { value: 'practitioner', label: 'Practitioner (Personal Experience)' },
  { value: 'curious_collaborator', label: 'Curious Collaborator (Questions)' },
  { value: 'polished_professional', label: 'Polished Professional' },
  { value: 'appreciative_contrarian', label: 'Appreciative Contrarian' },
  { value: 'story_sharer', label: 'Story Sharer (Mini-Anecdote)' },
  { value: 'energized_builder', label: 'Energized Builder (Action-Oriented)' },
  { value: 'networker', label: 'Networker (Let\'s Keep Talking)' },
];

let dialogContainer = null;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createDialog(selectedText) {
  if (dialogContainer) {
    dialogContainer.remove();
  }

  dialogContainer = document.createElement('div');
  dialogContainer.id = 'li-reply-assistant-overlay';

  const dialog = document.createElement('div');
  dialog.id = 'li-reply-assistant-dialog';

  dialog.innerHTML = `
    <div class="li-reply-header">
      <h3>Generate Reply</h3>
      <button class="li-reply-close" aria-label="Close">&times;</button>
    </div>

    <div class="li-reply-body">
      <div class="li-reply-field">
        <label>Selected Text</label>
        <div class="li-reply-selected-text">${escapeHtml(selectedText)}</div>
      </div>

      <div class="li-reply-field">
        <label for="li-reply-type">Response Type</label>
        <select id="li-reply-type">
          ${RESPONSE_TYPES.map(
            (type) => `<option value="${type.value}">${type.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="li-reply-field">
        <label for="li-reply-prompt">Style / Prompt (optional)</label>
        <textarea id="li-reply-prompt" placeholder="e.g., Keep it casual, add humor..."></textarea>
      </div>

      <button id="li-reply-generate" class="li-reply-btn-primary">Generate</button>

      <div id="li-reply-loading" class="li-reply-loading" style="display: none;">
        <div class="li-reply-spinner"></div>
        <span>Generating...</span>
      </div>

      <div id="li-reply-error" class="li-reply-error" style="display: none;"></div>

      <div id="li-reply-result-section" class="li-reply-field" style="display: none;">
        <label>Generated Reply</label>
        <textarea id="li-reply-result" readonly></textarea>
        <button id="li-reply-copy" class="li-reply-btn-secondary">Copy to Clipboard</button>
      </div>
    </div>
  `;

  dialogContainer.appendChild(dialog);
  document.body.appendChild(dialogContainer);

  loadSavedSettings();

  const closeBtn = dialog.querySelector('.li-reply-close');
  closeBtn.addEventListener('click', closeDialog);

  dialogContainer.addEventListener('click', (e) => {
    if (e.target === dialogContainer) {
      closeDialog();
    }
  });

  document.addEventListener('keydown', handleEscapeKey);

  const generateBtn = dialog.querySelector('#li-reply-generate');
  generateBtn.addEventListener('click', () => handleGenerate(selectedText));

  const copyBtn = dialog.querySelector('#li-reply-copy');
  copyBtn.addEventListener('click', handleCopy);

  const resultTextarea = dialog.querySelector('#li-reply-result');
  resultTextarea.addEventListener('focus', () => {
    resultTextarea.select();
  });
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeDialog();
  }
}

function closeDialog() {
  if (dialogContainer) {
    dialogContainer.remove();
    dialogContainer = null;
  }
  document.removeEventListener('keydown', handleEscapeKey);
}

async function loadSavedSettings() {
  try {
    const result = await chrome.storage.local.get(['lastResponseType', 'lastUserPrompt']);
    if (result.lastResponseType) {
      const typeSelect = document.querySelector('#li-reply-type');
      if (typeSelect) {
        typeSelect.value = result.lastResponseType;
      }
    }
    if (result.lastUserPrompt) {
      const promptTextarea = document.querySelector('#li-reply-prompt');
      if (promptTextarea) {
        promptTextarea.value = result.lastUserPrompt;
      }
    }
  } catch (err) {
    console.error('Error loading saved settings:', err);
  }
}

async function saveSettings(responseType, userPrompt) {
  try {
    await chrome.storage.local.set({
      lastResponseType: responseType,
      lastUserPrompt: userPrompt,
    });
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

function handleGenerate(selectedText) {
  const typeSelect = document.querySelector('#li-reply-type');
  const promptTextarea = document.querySelector('#li-reply-prompt');
  const loadingEl = document.querySelector('#li-reply-loading');
  const errorEl = document.querySelector('#li-reply-error');
  const resultSection = document.querySelector('#li-reply-result-section');
  const resultTextarea = document.querySelector('#li-reply-result');
  const generateBtn = document.querySelector('#li-reply-generate');

  const responseType = typeSelect.value;
  const userPrompt = promptTextarea.value.trim();

  saveSettings(responseType, userPrompt);

  generateBtn.disabled = true;
  loadingEl.style.display = 'flex';
  errorEl.style.display = 'none';
  resultSection.style.display = 'none';

  chrome.runtime.sendMessage(
    {
      type: 'CALL_LLM',
      payload: {
        selectedText,
        responseType,
        userPrompt: userPrompt || undefined,
      },
    },
    (response) => {
      generateBtn.disabled = false;
      loadingEl.style.display = 'none';

      if (chrome.runtime.lastError) {
        errorEl.textContent = 'Extension error. Please try again.';
        errorEl.style.display = 'block';
        return;
      }

      if (!response || !response.success) {
        const errorMessage = response?.error || 'Unknown error occurred';
        if (errorMessage.includes('fetch')) {
          errorEl.textContent = 'Backend not reachable. Is it running?';
        } else {
          errorEl.textContent = `Error: ${errorMessage}`;
        }
        errorEl.style.display = 'block';
        return;
      }

      resultTextarea.value = response.reply;
      resultSection.style.display = 'block';
    }
  );
}

async function handleCopy() {
  const resultTextarea = document.querySelector('#li-reply-result');
  const copyBtn = document.querySelector('#li-reply-copy');

  try {
    await navigator.clipboard.writeText(resultTextarea.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_REPLY_DIALOG') {
    createDialog(message.selectedText);
  }
});
