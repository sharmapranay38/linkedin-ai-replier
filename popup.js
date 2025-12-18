// Global variables
let selectedTone = 'friendly';
let selectedText = '';
let isDarkMode = false;
let replyHistory = [];
let savedTemplates = [];
let currentTemplate = null;


// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadSettings();
  loadHistoryAndTemplates();
  getSelectedText();
  setupKeyboardShortcuts();
});

// Initialize UI elements
function initializeUI() {
  // Tone selection
  document.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTone = btn.dataset.tone;
      
      // Show/hide custom input based on selection
      const customInputSection = document.getElementById('customInputSection');
      if (selectedTone === 'custom') {
        customInputSection.style.display = 'block';
      } else {
        customInputSection.style.display = 'none';
      }
    });
  });

  // Set default selected tone
  document.querySelector('.tone-btn[data-tone="friendly"]').classList.add('selected');

  // Length slider
  const lengthSlider = document.getElementById('lengthSlider');
  const currentLength = document.querySelector('.current-length');
  
  lengthSlider.addEventListener('input', () => {
    const lengths = ['Short', 'Medium', 'Long'];
    currentLength.textContent = lengths[lengthSlider.value - 1];
  });

  // Generate button
  document.getElementById('generateBtn').addEventListener('click', generateReply);

  // Action buttons
  document.getElementById('copyBtn').addEventListener('click', copyReply);
  document.getElementById('regenerateBtn').addEventListener('click', generateReply);
  document.getElementById('editBtn').addEventListener('click', editReply);

  // New feature buttons
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  document.getElementById('templatesBtn').addEventListener('click', showTemplates);
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('quickActionsBtn').addEventListener('click', showQuickActions);

  // Settings
  document.getElementById('settingsLink').addEventListener('click', showSettings);
  document.getElementById('dbSettingsLink').addEventListener('click', showDbSettings);
  document.getElementById('closeBtn').addEventListener('click', closePopup);
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['geminiKey', 'darkMode', 'replyHistory', 'savedTemplates'], (result) => {
    // Use hardcoded API key if none is stored
    if (!result.geminiKey) {
      chrome.storage.sync.set({ geminiKey: DEFAULT_GEMINI_API_KEY }, () => {
        console.log('Using default API key');
      });
    } else {
      console.log('Using stored API key');
    }
    
    // Load dark mode preference
    if (result.darkMode) {
      isDarkMode = result.darkMode;
      applyDarkMode();
    }
    
    // Load history and templates
    if (result.replyHistory) {
      replyHistory = result.replyHistory;
    }
    if (result.savedTemplates) {
      savedTemplates = result.savedTemplates;
    }
  });
}

// Save history and templates to storage
function saveHistoryAndTemplates() {
  chrome.storage.sync.set({
    replyHistory: replyHistory.slice(-50), // Keep last 50 replies
    savedTemplates: savedTemplates
  });
}

// Load history and templates
function loadHistoryAndTemplates() {
  chrome.storage.sync.get(['replyHistory', 'savedTemplates'], (result) => {
    if (result.replyHistory) {
      replyHistory = result.replyHistory;
    }
    if (result.savedTemplates) {
      savedTemplates = result.savedTemplates;
    }
  });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate reply
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateReply();
    }
    
    // Ctrl/Cmd + C to copy reply
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const replyBox = document.getElementById('replyBox');
      if (replyBox.textContent && replyBox.style.display !== 'none') {
        e.preventDefault();
        copyReply();
      }
    }
    
    // Ctrl/Cmd + H to show history
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      showHistory();
    }
    
    // Ctrl/Cmd + T to show templates
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      showTemplates();
    }
    
    // Ctrl/Cmd + Q to show quick actions
    if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
      e.preventDefault();
      showQuickActions();
    }
    
    // Escape to close popup
    if (e.key === 'Escape') {
      closePopup();
    }
    
    // Number keys for quick tone selection
    if (e.key >= '1' && e.key <= '7') {
      const tones = ['formal', 'friendly', 'insightful', 'funny', 'thanks', 'plug-product', 'custom'];
      const toneIndex = parseInt(e.key) - 1;
      if (tones[toneIndex]) {
        e.preventDefault();
        selectTone(tones[toneIndex]);
      }
    }
  });
}

// Select tone programmatically
function selectTone(tone) {
  document.querySelectorAll('.tone-btn').forEach(btn => btn.classList.remove('selected'));
  const toneBtn = document.querySelector(`.tone-btn[data-tone="${tone}"]`);
  if (toneBtn) {
    toneBtn.classList.add('selected');
    selectedTone = tone;
    
    const customInputSection = document.getElementById('customInputSection');
    if (tone === 'custom') {
      customInputSection.style.display = 'block';
    } else {
      customInputSection.style.display = 'none';
    }
  }
}

// Toggle dark mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  applyDarkMode();
  chrome.storage.sync.set({ darkMode: isDarkMode });
}

// Apply dark mode styles
function applyDarkMode() {
  const body = document.body;
  if (isDarkMode) {
    body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').innerHTML = '<span class="action-icon">L</span>Light';
  } else {
    body.classList.remove('dark-mode');
    document.getElementById('darkModeBtn').innerHTML = '<span class="action-icon">D</span>Dark';
  }
}

// Get selected text from active tab
function getSelectedText() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        selectedText = response.text;
        document.getElementById('selectedText').textContent = selectedText;
      } else {
        document.getElementById('selectedText').textContent = 'No text selected';
      }
    });
  });
}

// Generate reply using Gemini API
async function generateReply() {
  if (!selectedText) {
    alert('Please select some text first');
    return;
  }

  const generateBtn = document.getElementById('generateBtn');
  const spinner = document.getElementById('spinner');
  const replySection = document.getElementById('replySection');

  // Show loading state
  generateBtn.disabled = true;
  spinner.style.display = 'block';
  replySection.style.display = 'none';

  try {
    // Get API key from Chrome storage
    const result = await chrome.storage.sync.get(['geminiKey']);
    const apiKey = result.geminiKey || DEFAULT_GEMINI_API_KEY;
    
    if (!apiKey) {
      alert('Please set your Gemini API key in settings');
      return;
    }

    // Get options
    const options = getOptions();
    
    // Create prompt based on tone and options
    const prompt = createPrompt(selectedText, selectedTone, options);

    // Make API request
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      throw new Error('No reply generated');
    }

    // Display reply
    document.getElementById('replyBox').textContent = aiReply;
    replySection.style.display = 'block';

    // Save to history
    saveToHistory(selectedText, aiReply, selectedTone, options);

  } catch (error) {
    console.error('Error generating reply:', error);
    alert(`Error: ${error.message}`);
  } finally {
    // Hide loading state
    generateBtn.disabled = false;
    spinner.style.display = 'none';
  }
}

// Save reply to history
function saveToHistory(originalText, reply, tone, options) {
  const historyItem = {
    id: Date.now(),
    originalText: originalText,
    reply: reply,
    tone: tone,
    options: options,
    timestamp: new Date().toISOString(),
    engagement: Math.floor(Math.random() * 10) + 1 // Simulated engagement for demo
  };
  
  replyHistory.unshift(historyItem);
  saveHistoryAndTemplates();
  
  // Auto-save as template if engagement is high (simulated)
  if (historyItem.engagement >= 8) {
    const templateName = `High-Engagement Reply (${tone})`;
    const template = {
      id: Date.now(),
      name: templateName,
      reply: reply,
      tone: tone,
      options: options,
      timestamp: new Date().toISOString(),
      autoGenerated: true
    };
    
    // Check if template already exists
    const exists = savedTemplates.some(t => t.reply === reply);
    if (!exists) {
      savedTemplates.push(template);
      saveHistoryAndTemplates();
      console.log('Auto-saved high-engagement reply as template');
    }
  }
}

// Get current options
function getOptions() {
  return {
    length: document.getElementById('lengthSlider').value,
    endWithQuestion: document.getElementById('endWithQuestion').checked,
    addHashtags: document.getElementById('addHashtags').checked,
    includeEmojis: document.getElementById('includeEmojis').checked,
    businessFocus: document.getElementById('businessFocus').checked,
    bulletFormat: document.getElementById('bulletFormat').checked
  };
}

// Create prompt based on tone and options
function createPrompt(text, tone, options) {
  let prompt = `Reply to this LinkedIn comment: "${text}"\n\n`;
  
  // Handle custom tone
  if (tone === 'custom') {
    const customInstructions = document.getElementById('customInput').value.trim();
    if (customInstructions) {
      prompt += `Follow these custom instructions: ${customInstructions}\n\n`;
    } else {
      prompt += 'Use a neutral tone. ';
    }
  } else {
    prompt += `Use a ${tone} tone. `;
  }
  
  prompt += 'Without any placeholders also dont use any markdown format, just plain text nothing more. ';
  
  // Add length instruction
  const lengths = { '1': 'short', '2': 'medium', '3': 'long' };
  prompt += `Make it ${lengths[options.length]} length. `;
  
  // Add specific instructions based on options
  if (options.endWithQuestion) {
    prompt += 'End with a relevant question. ';
  }
  
  if (options.addHashtags) {
    prompt += 'Include 2-3 relevant hashtags. ';
  }
  
  if (options.includeEmojis) {
    prompt += 'Use appropriate emojis. ';
  }
  
  if (options.businessFocus) {
    prompt += 'Keep it professional and business-focused. ';
  }
  
  if (options.bulletFormat) {
    prompt += 'Use bullet points for better readability. ';
  }
  
  prompt += '\n\nGenerate a LinkedIn comment reply:';
  
  return prompt;
}

// Copy reply to clipboard
function copyReply() {
  const replyText = document.getElementById('replyBox').textContent;
  navigator.clipboard.writeText(replyText).then(() => {
    // Show temporary success message
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span class="action-icon">C</span>Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  });
}

// Edit reply
function editReply() {
  const replyBox = document.getElementById('replyBox');
  const currentText = replyBox.textContent;
  
  // Create a textarea for editing
  const textarea = document.createElement('textarea');
  textarea.value = currentText;
  textarea.style.cssText = `
    width: 100%;
    min-height: 80px;
    background: #e8f5e8;
    color: #333333;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
  `;
  
  // Replace the reply box with textarea
  replyBox.style.display = 'none';
  replyBox.parentNode.insertBefore(textarea, replyBox);
  
  // Add save/cancel buttons
  const editActions = document.createElement('div');
  editActions.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 10px;
  `;
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.className = 'action-btn';
  saveBtn.onclick = () => {
    replyBox.textContent = textarea.value;
    replyBox.style.display = 'block';
    textarea.remove();
    editActions.remove();
  };
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'action-btn';
  cancelBtn.onclick = () => {
    replyBox.style.display = 'block';
    textarea.remove();
    editActions.remove();
  };
  
  editActions.appendChild(saveBtn);
  editActions.appendChild(cancelBtn);
  replyBox.parentNode.insertBefore(editActions, replyBox.nextSibling);
  
  textarea.focus();
}

// Show reply history
function showHistory() {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  
  let historyHTML = `
    <div class="settings-content history-content">
      <div class="settings-title">Reply History</div>
      <div class="history-list">
  `;
  
  if (replyHistory.length === 0) {
    historyHTML += '<p class="no-history">No reply history yet. Generate some replies to see them here!</p>';
  } else {
    replyHistory.slice(0, 10).forEach((item, index) => {
      const date = new Date(item.timestamp).toLocaleDateString();
      const engagementClass = item.engagement >= 8 ? 'high-engagement' : item.engagement >= 5 ? 'medium-engagement' : 'low-engagement';
      historyHTML += `
        <div class="history-item ${engagementClass}">
          <div class="history-header">
            <span class="history-tone">${item.tone}</span>
            <div class="history-meta">
              <span class="history-date">${date}</span>
              <span class="engagement-score">Score: ${item.engagement}/10</span>
            </div>
          </div>
          <div class="history-original">"${item.originalText.substring(0, 100)}${item.originalText.length > 100 ? '...' : ''}"</div>
          <div class="history-reply">${item.reply.substring(0, 150)}${item.reply.length > 150 ? '...' : ''}</div>
          <div class="history-actions">
            <button class="history-btn use-reply-btn" data-index="${index}">Use This Reply</button>
            <button class="history-btn save-template-btn" data-index="${index}">Save as Template</button>
          </div>
        </div>
      `;
    });
  }
  
  historyHTML += `
      </div>
      <button class="settings-btn" id="closeHistory">Close</button>
    </div>
  `;
  
  modal.innerHTML = historyHTML;
  document.body.appendChild(modal);
  
  // Add event listeners for history buttons
  modal.querySelectorAll('.use-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      useHistoryReply(index);
    });
  });
  
  modal.querySelectorAll('.save-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      saveAsTemplate(index);
    });
  });
  
  document.getElementById('closeHistory').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Use reply from history
function useHistoryReply(index) {
  const item = replyHistory[index];
  document.getElementById('replyBox').textContent = item.reply;
  document.getElementById('replySection').style.display = 'block';
  
  // Apply the tone and options from history
  selectTone(item.tone);
  
  // Apply options
  if (item.options) {
    document.getElementById('lengthSlider').value = item.options.length;
    document.getElementById('endWithQuestion').checked = item.options.endWithQuestion;
    document.getElementById('addHashtags').checked = item.options.addHashtags;
    document.getElementById('includeEmojis').checked = item.options.includeEmojis;
    document.getElementById('businessFocus').checked = item.options.businessFocus;
    document.getElementById('bulletFormat').checked = item.options.bulletFormat;
  }
  
  // Close history modal
  document.querySelector('.settings-modal').remove();
}

// Save reply as template
function saveAsTemplate(index) {
  const item = replyHistory[index];
  const templateName = prompt('Enter a name for this template:');
  
  if (templateName) {
    const template = {
      id: Date.now(),
      name: templateName,
      reply: item.reply,
      tone: item.tone,
      options: item.options,
      timestamp: new Date().toISOString()
    };
    
    savedTemplates.push(template);
    saveHistoryAndTemplates();
    alert('Template saved successfully!');
  }
}

// Show templates
function showTemplates() {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  
  let templatesHTML = `
    <div class="settings-content history-content">
      <div class="settings-title">Saved Templates</div>
      <div class="templates-list">
  `;
  
  if (savedTemplates.length === 0) {
    templatesHTML += '<p class="no-history">No templates saved yet. Save some replies as templates to see them here!</p>';
  } else {
    savedTemplates.forEach((template, index) => {
      const date = new Date(template.timestamp).toLocaleDateString();
      templatesHTML += `
        <div class="template-item">
          <div class="template-header">
            <span class="template-name">${template.name}</span>
            <span class="template-date">${date}</span>
          </div>
          <div class="template-reply">${template.reply.substring(0, 150)}${template.reply.length > 150 ? '...' : ''}</div>
          <div class="template-actions">
            <button class="history-btn use-template-btn" data-index="${index}">Use Template</button>
            <button class="history-btn delete-btn delete-template-btn" data-index="${index}">Delete</button>
          </div>
        </div>
      `;
    });
  }
  
  templatesHTML += `
      </div>
      <button class="settings-btn" id="closeTemplates">Close</button>
    </div>
  `;
  
  modal.innerHTML = templatesHTML;
  document.body.appendChild(modal);
  
  // Add event listeners for template buttons
  modal.querySelectorAll('.use-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      useTemplate(index);
    });
  });
  
  modal.querySelectorAll('.delete-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      deleteTemplate(index);
    });
  });
  
  document.getElementById('closeTemplates').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Use template
function useTemplate(index) {
  const template = savedTemplates[index];
  document.getElementById('replyBox').textContent = template.reply;
  document.getElementById('replySection').style.display = 'block';
  
  // Apply the tone and options from template
  selectTone(template.tone);
  
  // Apply options
  if (template.options) {
    document.getElementById('lengthSlider').value = template.options.length;
    document.getElementById('endWithQuestion').checked = template.options.endWithQuestion;
    document.getElementById('addHashtags').checked = template.options.addHashtags;
    document.getElementById('includeEmojis').checked = template.options.includeEmojis;
    document.getElementById('businessFocus').checked = template.options.businessFocus;
    document.getElementById('bulletFormat').checked = template.options.bulletFormat;
  }
  
  // Close templates modal
  document.querySelector('.settings-modal').remove();
}

// Delete template
function deleteTemplate(index) {
  if (confirm('Are you sure you want to delete this template?')) {
    savedTemplates.splice(index, 1);
    saveHistoryAndTemplates();
    showTemplates(); // Refresh the modal
  }
}

// Show quick actions
function showQuickActions() {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  
  const quickActionsHTML = `
    <div class="settings-content">
      <div class="settings-title">Quick Actions</div>
      <div class="quick-actions-grid">
        <button class="quick-action-btn" data-action="thanks">
          <span class="quick-icon">T</span>
          Thank You
        </button>
        <button class="quick-action-btn" data-action="agree">
          <span class="quick-icon">A</span>
          Agree
        </button>
        <button class="quick-action-btn" data-action="question">
          <span class="quick-icon">Q</span>
          Ask Question
        </button>
        <button class="quick-action-btn" data-action="insight">
          <span class="quick-icon">I</span>
          Add Insight
        </button>
        <button class="quick-action-btn" data-action="connect">
          <span class="quick-icon">C</span>
          Connect
        </button>
        <button class="quick-action-btn" data-action="share">
          <span class="quick-icon">S</span>
          Share Experience
        </button>
      </div>
      <button class="settings-btn" id="closeQuickActions">Close</button>
    </div>
  `;
  
  modal.innerHTML = quickActionsHTML;
  document.body.appendChild(modal);
  
  // Add event listeners for quick action buttons
  modal.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      quickReply(action);
    });
  });
  
  document.getElementById('closeQuickActions').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Quick reply function
function quickReply(type) {
  const quickReplies = {
    thanks: "Thank you for sharing this!",
    agree: "I completely agree with this perspective!",
    question: "This is interesting! What are your thoughts on [specific aspect]?",
    insight: "Great point! I'd also add that [your insight].",
    connect: "Would love to connect and discuss this further!",
    share: "This reminds me of when I [relevant experience]. Thanks for sharing!"
  };
  
  document.getElementById('replyBox').textContent = quickReplies[type];
  document.getElementById('replySection').style.display = 'block';
  
  // Close quick actions modal
  document.querySelector('.settings-modal').remove();
}

// Show settings modal
function showSettings() {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.innerHTML = `
    <div class="settings-content">
      <div class="settings-title">API Settings</div>
      <div class="api-key-section">
        <label for="apiKeyInput">Gemini API Key:</label>
        <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Enter your Gemini API key">
        <div class="api-key-info">
          <small>Current key: <span id="currentKeyDisplay">Loading...</span></small>
          <button class="toggle-visibility-btn" id="toggleVisibility">👁️</button>
        </div>
      </div>
      <div class="settings-actions">
        <button class="settings-btn" id="saveApiKey">Save API Key</button>
        <button class="settings-btn" id="useDefaultKey" style="background: #28a745;">Use Default Key</button>
        <button class="settings-btn" style="background: #666;" id="closeSettings">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load current API key
  chrome.storage.sync.get(['geminiKey'], (result) => {
    const currentKey = result.geminiKey || DEFAULT_GEMINI_API_KEY;
    document.getElementById('apiKeyInput').value = currentKey;
    
    // Show masked current key
    const maskedKey = currentKey.substring(0, 8) + '...' + currentKey.substring(currentKey.length - 4);
    document.getElementById('currentKeyDisplay').textContent = maskedKey;
  });
  
  // Event listeners
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ geminiKey: apiKey }, () => {
        alert('API key saved successfully!');
        modal.remove();
      });
    } else {
      alert('Please enter an API key');
    }
  });
  
  document.getElementById('useDefaultKey').addEventListener('click', () => {
    chrome.storage.sync.set({ geminiKey: DEFAULT_GEMINI_API_KEY }, () => {
      alert('Default API key restored!');
      modal.remove();
    });
  });
  
  document.getElementById('toggleVisibility').addEventListener('click', () => {
    const input = document.getElementById('apiKeyInput');
    const button = document.getElementById('toggleVisibility');
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  });
  
  document.getElementById('closeSettings').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show database settings modal
function showDbSettings() {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.innerHTML = `
    <div class="settings-content">
      <div class="settings-title">Database Settings</div>
      <div class="db-form">
        <div class="form-group">
          <label for="dbHost">Host:</label>
          <input type="text" id="dbHost" placeholder="localhost" class="db-input">
        </div>
        <div class="form-group">
          <label for="dbPort">Port:</label>
          <input type="text" id="dbPort" placeholder="3306" class="db-input">
        </div>
        <div class="form-group">
          <label for="dbName">Database Name:</label>
          <input type="text" id="dbName" placeholder="linkedin_replies" class="db-input">
        </div>
        <div class="form-group">
          <label for="dbUser">Username:</label>
          <input type="text" id="dbUser" placeholder="root" class="db-input">
        </div>
        <div class="form-group">
          <label for="dbPass">Password:</label>
          <input type="password" id="dbPass" placeholder="password" class="db-input">
        </div>
        <div class="db-actions">
          <button class="settings-btn" id="testDbConnection">Test Connection</button>
          <button class="settings-btn" id="saveDbSettings">Save Settings</button>
          <button class="settings-btn" style="background: #666;" id="closeDbSettings">Cancel</button>
        </div>
        <div id="dbStatus" class="db-status"></div>
        
        <div class="api-key-status">
          <h4>API Key Status</h4>
          <div id="apiKeyStatus" class="status-info">Checking...</div>
          <button class="settings-btn" id="checkApiKeyStatus" style="background: #28a745; margin-top: 10px;">Check API Key Status</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load current database settings
  chrome.storage.sync.get(['dbHost', 'dbPort', 'dbName', 'dbUser', 'dbPass'], (result) => {
    if (result.dbHost) document.getElementById('dbHost').value = result.dbHost;
    if (result.dbPort) document.getElementById('dbPort').value = result.dbPort;
    if (result.dbName) document.getElementById('dbName').value = result.dbName;
    if (result.dbUser) document.getElementById('dbUser').value = result.dbUser;
    if (result.dbPass) document.getElementById('dbPass').value = result.dbPass;
  });
  
  // Check API key status on load
  checkApiKeyStatus();
  
  // Event listeners
  document.getElementById('testDbConnection').addEventListener('click', testDbConnection);
  document.getElementById('saveDbSettings').addEventListener('click', saveDbSettings);
  document.getElementById('checkApiKeyStatus').addEventListener('click', checkApiKeyStatus);
  document.getElementById('closeDbSettings').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Test database connection
async function testDbConnection() {
  const statusDiv = document.getElementById('dbStatus');
  const testBtn = document.getElementById('testDbConnection');
  
  // Get database settings
  const dbConfig = {
    host: document.getElementById('dbHost').value.trim(),
    port: document.getElementById('dbPort').value.trim(),
    name: document.getElementById('dbName').value.trim(),
    user: document.getElementById('dbUser').value.trim(),
    pass: document.getElementById('dbPass').value.trim()
  };
  
  // Validate inputs
  if (!dbConfig.host || !dbConfig.port || !dbConfig.name || !dbConfig.user) {
    statusDiv.innerHTML = '<span class="error">Please fill in all required fields</span>';
    return;
  }
  
  // Show testing state
  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  statusDiv.innerHTML = '<span class="info">Testing connection...</span>';
  
  try {
    // Send message to background script to test connection
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'testDbConnection',
        dbConfig: dbConfig
      }, resolve);
    });
    
    if (response.success) {
      statusDiv.innerHTML = '<span class="success">✓ Connection successful!</span>';
    } else {
      statusDiv.innerHTML = `<span class="error">✗ Connection failed: ${response.error}</span>`;
    }
  } catch (error) {
    statusDiv.innerHTML = `<span class="error">✗ Error: ${error.message}</span>`;
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Connection';
  }
}

// Save database settings
async function saveDbSettings() {
  const statusDiv = document.getElementById('dbStatus');
  
  // Get database settings
  const dbConfig = {
    host: document.getElementById('dbHost').value.trim(),
    port: document.getElementById('dbPort').value.trim(),
    name: document.getElementById('dbName').value.trim(),
    user: document.getElementById('dbUser').value.trim(),
    pass: document.getElementById('dbPass').value.trim()
  };
  
  // Validate inputs
  if (!dbConfig.host || !dbConfig.port || !dbConfig.name || !dbConfig.user) {
    statusDiv.innerHTML = '<span class="error">Please fill in all required fields</span>';
    return;
  }
  
  try {
    // Send message to background script to save settings
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'saveDbSettings',
        dbConfig: dbConfig
      }, resolve);
    });
    
    if (response.success) {
      statusDiv.innerHTML = '<span class="success">✓ Settings saved successfully!</span>';
    } else {
      statusDiv.innerHTML = `<span class="error">✗ Failed to save settings: ${response.error}</span>`;
    }
  } catch (error) {
    statusDiv.innerHTML = `<span class="error">✗ Error: ${error.message}</span>`;
  }
}

// Check API key status in database
async function checkApiKeyStatus() {
  const statusDiv = document.getElementById('apiKeyStatus');
  const checkBtn = document.getElementById('checkApiKeyStatus');
  
  // Get database settings
  const dbConfig = {
    host: document.getElementById('dbHost').value.trim(),
    port: document.getElementById('dbPort').value.trim(),
    name: document.getElementById('dbName').value.trim(),
    user: document.getElementById('dbUser').value.trim(),
    pass: document.getElementById('dbPass').value.trim()
  };
  
  // Check if database is configured
  if (!dbConfig.host || !dbConfig.port || !dbConfig.name || !dbConfig.user) {
    statusDiv.innerHTML = '<span class="error">Database not configured</span>';
    return;
  }
  
  // Show checking state
  checkBtn.disabled = true;
  checkBtn.textContent = 'Checking...';
  statusDiv.innerHTML = '<span class="info">Checking API key status...</span>';
  
  try {
    // Send message to background script to check API key
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'getApiKeyFromDb',
        keyName: 'gemini'
      }, resolve);
    });
    
    if (response && response.success) {
      const maskedKey = response.keyValue.substring(0, 8) + '...' + response.keyValue.substring(response.keyValue.length - 4);
      statusDiv.innerHTML = `<span class="success">✓ API key found: ${maskedKey}</span>`;
    } else {
      statusDiv.innerHTML = '<span class="error">✗ No API key found in database</span>';
    }
  } catch (error) {
    statusDiv.innerHTML = `<span class="error">✗ Error: ${error.message}</span>`;
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = 'Check API Key Status';
  }
}

// Close popup
function closePopup() {
  window.close();
}
  