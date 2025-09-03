// Content script for PostPen Extension - Side Panel Version
console.log("PostPen Extension content script loaded");

// Global variables
let selectedTone = 'friendly';
let selectedText = '';
let isDarkMode = false;
let replyHistory = [];
let savedTemplates = [];
let isPanelOpen = false;

// Initialize the side panel
function initializeSidePanel() {
  console.log("Initializing side panel...");
  
  // Inject CSS styles
  const style = document.createElement('style');
  style.textContent = `
    /* LinkedIn AI Assistant Side Panel Styles */
    .linkedin-ai-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: #ffffff;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      transition: right 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-y: auto;
      border-left: 1px solid #e0e0e0;
    }

    /* When panel is open */
    .linkedin-ai-panel.open {
      right: 0;
    }

    /* Force LinkedIn to be squished by constraining the viewport */
    body.panel-open {
      width: calc(100vw - 400px) !important;
      max-width: calc(100vw - 400px) !important;
      overflow-x: auto !important;
      position: relative !important;
    }

    /* Force ALL elements to respect the container width */
    body.panel-open * {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Specifically target LinkedIn's containers */
    body.panel-open .scaffold-layout,
    body.panel-open .scaffold-finite-scroll,
    body.panel-open .scaffold-layout__main,
    body.panel-open .scaffold-layout__content,
    body.panel-open .scaffold-layout__sidebar,
    body.panel-open #global-nav,
    body.panel-open .artdeco-card,
    body.panel-open .feed-shared-update-v2,
    body.panel-open .feed-identity-module,
    body.panel-open .feed-shared-text,
    body.panel-open .feed-shared-inline-show-more-text {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
    }

    /* Panel positioning - make sure it's outside the constrained area */
    .linkedin-ai-panel.open {
      position: fixed !important;
      right: 0 !important;
      top: 0 !important;
      width: 400px !important;
      height: 100vh !important;
      z-index: 10000 !important;
    }

    .linkedin-ai-panel.dark-mode {
      background: #1a1a1a;
      color: #ffffff;
      border-left-color: #444;
    }

    /* Header */
    .linkedin-ai-panel .header {
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      padding: 15px 20px;
      border-radius: 0 0 8px 8px;
    }

    .linkedin-ai-panel .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .linkedin-ai-panel .header-icon {
      font-size: 18px;
      font-weight: bold;
      color: white;
    }

    .linkedin-ai-panel .header-title {
      font-size: 16px;
      font-weight: 600;
      flex-grow: 1;
      text-align: center;
      margin-left: 10px;
      color: white;
    }

    .linkedin-ai-panel .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .linkedin-ai-panel .header-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .linkedin-ai-panel .header-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .linkedin-ai-panel .close-btn {
      font-size: 20px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: background-color 0.2s;
      color: white;
    }

    .linkedin-ai-panel .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    /* Content */
    .linkedin-ai-panel .content {
      padding: 20px;
    }

    /* Selected Text Section */
    .linkedin-ai-panel .selected-text-section {
      margin-bottom: 20px;
    }

    .linkedin-ai-panel .selected-text-box {
      background: #f8f8f8;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .selected-text-box {
      background: #2d2d2d;
      border-color: #444;
    }

    .linkedin-ai-panel .selected-text-label {
      font-weight: bold;
      font-size: 12px;
      color: #333333;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .selected-text-label {
      color: #ccc;
    }

    .linkedin-ai-panel .selected-text {
      color: #666666;
      font-size: 14px;
      line-height: 1.4;
      min-height: 20px;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .selected-text {
      color: #ccc;
    }

    /* Context button */
    .linkedin-ai-panel .context-btn {
      background: #ff6b35;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 11px;
      cursor: pointer;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .linkedin-ai-panel .context-btn:hover {
      background: #f7931e;
      transform: translateY(-1px);
    }

    .linkedin-ai-panel .context-icon {
      font-size: 12px;
    }

    /* Section Labels */
    .linkedin-ai-panel .section-label {
      font-weight: bold;
      font-size: 12px;
      color: #333333;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .section-label {
      color: #ccc;
    }

    /* Tone Section */
    .linkedin-ai-panel .tone-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }

    .linkedin-ai-panel .tone-btn {
      background: #ffffff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      line-height: 1.2;
    }

    .linkedin-ai-panel.dark-mode .tone-btn {
      background: #2d2d2d;
      border-color: #444;
      color: #fff;
    }

    .linkedin-ai-panel .tone-btn:hover {
      border-color: #ff6b35;
      transform: translateY(-1px);
    }

    .linkedin-ai-panel .tone-btn.selected {
      background: #ff6b35;
      border-color: #ff6b35;
      color: white;
    }

    /* Custom Input Section */
    .linkedin-ai-panel .custom-input-section {
      margin-bottom: 20px;
    }

    .linkedin-ai-panel .custom-textarea {
      width: 100%;
      min-height: 80px;
      background: #f8f8f8;
      color: #333333;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      transition: all 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .custom-textarea {
      background: #2d2d2d;
      border-color: #444;
      color: #fff;
    }

    .linkedin-ai-panel .custom-textarea:focus {
      outline: none;
      border-color: #ff6b35;
      box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
    }

    .linkedin-ai-panel .custom-textarea::placeholder {
      color: #999999;
    }

    /* Options Section */
    .linkedin-ai-panel .options-section {
      margin-bottom: 20px;
    }

    .linkedin-ai-panel .length-slider-container {
      margin-bottom: 20px;
    }

    .linkedin-ai-panel .length-slider-container label {
      font-weight: 600;
      font-size: 13px;
      color: #333333;
      margin-bottom: 8px;
      display: block;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .length-slider-container label {
      color: #ccc;
    }

    .linkedin-ai-panel .slider-container {
      position: relative;
    }

    .linkedin-ai-panel .length-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #e0e0e0;
      outline: none;
      -webkit-appearance: none;
      transition: all 0.3s ease;
    }

    .linkedin-ai-panel .length-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ff6b35;
      cursor: pointer;
      transition: all 0.2s;
    }

    .linkedin-ai-panel .slider-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 11px;
      color: #666666;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .slider-labels {
      color: #ccc;
    }

    .linkedin-ai-panel .current-length {
      font-weight: 600;
      color: #ff6b35;
    }

    .linkedin-ai-panel .toggle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .linkedin-ai-panel .toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .linkedin-ai-panel .toggle-label {
      font-size: 12px;
      font-weight: 500;
      color: #333333;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .toggle-label {
      color: #ccc;
    }

    .linkedin-ai-panel .toggle-switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
    }

    .linkedin-ai-panel .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .linkedin-ai-panel .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 20px;
    }

    .linkedin-ai-panel .toggle-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    .linkedin-ai-panel input:checked + .toggle-slider {
      background-color: #ff6b35;
    }

    .linkedin-ai-panel input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    /* Action Buttons Row */
    .linkedin-ai-panel .action-buttons-row {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .linkedin-ai-panel .secondary-btn {
      flex: 1;
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      text-align: center;
      line-height: 1.2;
    }

    .linkedin-ai-panel.dark-mode .secondary-btn {
      background: #2d2d2d;
      border-color: #444;
      color: #fff;
    }

    .linkedin-ai-panel .secondary-btn:hover {
      background: #e8e8e8;
      border-color: #ff6b35;
      transform: translateY(-1px);
    }

    .linkedin-ai-panel.dark-mode .secondary-btn:hover {
      background: #3d3d3d;
    }

    /* Generate Button */
    .linkedin-ai-panel .generate-btn {
      width: 100%;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 15px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
      position: relative;
    }

    .linkedin-ai-panel .generate-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    .linkedin-ai-panel .generate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .linkedin-ai-panel .spinner {
      display: none;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Reply Section */
    .linkedin-ai-panel .reply-section {
      background: #f8f8f8;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .reply-section {
      background: #2d2d2d;
      border-color: #444;
    }

    .linkedin-ai-panel .reply-label {
      font-weight: bold;
      font-size: 12px;
      color: #333333;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .reply-label {
      color: #ccc;
    }

    .linkedin-ai-panel .reply-box {
      background: #e8f5e8;
      color: #333333;
      border: 1px solid #c8e6c9;
      border-radius: 6px;
      padding: 12px;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 15px;
      min-height: 60px;
      white-space: pre-wrap;
      transition: all 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .reply-box {
      background: #2d2d2d;
      border-color: #444;
      color: #fff;
    }

    .linkedin-ai-panel .reply-actions {
      display: flex;
      gap: 8px;
    }

    .linkedin-ai-panel .action-btn {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      text-align: center;
      line-height: 1.1;
      min-width: 0;
      overflow: hidden;
    }

    .linkedin-ai-panel.dark-mode .action-btn {
      background: #2d2d2d;
      border-color: #444;
      color: #fff;
    }

    .linkedin-ai-panel .action-btn:hover {
      background: #f0f0f0;
      border-color: #ff6b35;
    }

    .linkedin-ai-panel.dark-mode .action-btn:hover {
      background: #3d3d3d;
    }

    /* Footer */
    .linkedin-ai-panel .footer {
      padding: 15px 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .footer {
      border-top-color: #444;
    }

    .linkedin-ai-panel .keyboard-shortcuts {
      flex: 1;
    }

    .linkedin-ai-panel .shortcut-hint {
      font-size: 10px;
      color: #666666;
      transition: color 0.3s ease;
    }

    .linkedin-ai-panel.dark-mode .shortcut-hint {
      color: #ccc;
    }

    .linkedin-ai-panel .settings-link {
      font-size: 12px;
      color: #ff6b35;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s;
    }

    .linkedin-ai-panel .settings-link:hover {
      color: #f7931e;
    }

    /* Toggle Button */
    #linkedin-ai-toggle {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background: #ff6b35;
      color: white;
      padding: 12px 8px;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      z-index: 9999;
      font-size: 12px;
      font-weight: 600;
      box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      text-align: center;
      line-height: 1.2;
    }

    #linkedin-ai-toggle:hover {
      background: #f7931e;
      transform: translateY(-50%) translateX(-2px);
    }
  `;
  document.head.appendChild(style);

  // Create the side panel container
  const panel = document.createElement('div');
  panel.id = 'linkedin-ai-panel';
  panel.className = 'linkedin-ai-panel';
  console.log("Panel created:", panel);

  // Create the toggle button
  const toggleBtn = document.createElement('div');
  toggleBtn.id = 'linkedin-ai-toggle';
  toggleBtn.innerHTML = 'P<br>PostPen';
  toggleBtn.title = 'Open PostPen Extension';
  console.log("Toggle button created:", toggleBtn);

  // Add hover effect
  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.background = '#005885';
    toggleBtn.style.transform = 'translateY(-50%) translateX(-2px)';
  });

  toggleBtn.addEventListener('mouseleave', () => {
          toggleBtn.style.background = '#f7931e';
    toggleBtn.style.transform = 'translateY(-50%)';
  });

  // Toggle panel visibility
  toggleBtn.addEventListener('click', () => {
    console.log("Toggle button clicked! isPanelOpen:", isPanelOpen);
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  // Add elements to page
  document.body.appendChild(panel);
  document.body.appendChild(toggleBtn);
  console.log("Elements added to page");

  // Initialize panel content
  initializePanelContent();
  loadSettings();
  setupTextSelection();
  console.log("Side panel initialization complete");
}

// Initialize panel content
function initializePanelContent() {
  const panel = document.getElementById('linkedin-ai-panel');
  
  panel.innerHTML = `
    <div class="header">
      <div class="header-content">
        <span class="header-icon">P</span>
        <span class="header-title">PostPen Extension</span>
        <div class="header-actions">
          <button class="header-btn" id="darkModeBtn" title="Toggle Dark Mode">
            <span class="action-icon">D</span>Dark
          </button>
          <span class="close-btn" id="closeBtn">X</span>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="selected-text-section">
        <div class="selected-text-box">
          <div class="selected-text-label">SELECTED TEXT:</div>
          <div class="selected-text" id="selectedText">No text selected</div>
          <button class="context-btn" id="contextBtn" title="View Context" style="display: none;">
            <span class="context-icon">👁</span> View Context
          </button>
        </div>
      </div>

      <div class="tone-section">
        <div class="section-label">CHOOSE TONE:</div>
        <div class="tone-grid">
          <button class="tone-btn" data-tone="formal">F<br>FORMAL</button>
          <button class="tone-btn" data-tone="friendly">F<br>FRIENDLY</button>
          <button class="tone-btn" data-tone="insightful">I<br>INSIGHTFUL</button>
          <button class="tone-btn" data-tone="funny">F<br>FUNNY</button>
          <button class="tone-btn" data-tone="thanks">T<br>THANKS</button>
          <button class="tone-btn" data-tone="plug-product">P<br>PLUG PRODUCT</button>
          <button class="tone-btn" data-tone="custom">C<br>CUSTOM</button>
        </div>
      </div>

      <div class="custom-input-section" id="customInputSection" style="display: none;">
        <div class="section-label">CUSTOM INSTRUCTIONS:</div>
        <textarea 
          id="customInput" 
          placeholder="Enter your custom instructions for the AI"
          class="custom-textarea"
        ></textarea>
      </div>

      <div class="options-section">
        <div class="section-label">RESPONSE OPTIONS:</div>
        <div class="length-slider-container">
          <label>Length:</label>
          <div class="slider-container">
            <input type="range" id="lengthSlider" min="1" max="3" value="2" class="length-slider">
            <div class="slider-labels">
              <span>Short</span>
              <span class="current-length">Medium</span>
              <span>Long</span>
            </div>
          </div>
        </div>
        
        <div class="toggle-grid">
          <div class="toggle-item">
            <label class="toggle-label">Are you the owner?</label>
            <label class="toggle-switch">
              <input type="checkbox" id="isOwner">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">End with Question</label>
            <label class="toggle-switch">
              <input type="checkbox" id="endWithQuestion">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">Add Hashtags</label>
            <label class="toggle-switch">
              <input type="checkbox" id="addHashtags">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">Include Emojis</label>
            <label class="toggle-switch">
              <input type="checkbox" id="includeEmojis">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">Business Focus</label>
            <label class="toggle-switch">
              <input type="checkbox" id="businessFocus">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">Bullet Format</label>
            <label class="toggle-switch">
              <input type="checkbox" id="bulletFormat">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="action-buttons-row">
        <button class="secondary-btn" id="quickActionsBtn">Q<br>Quick Actions</button>
        <button class="secondary-btn" id="historyBtn">H<br>History</button>
        <button class="secondary-btn" id="templatesBtn">T<br>Templates</button>
      </div>

      <button class="generate-btn" id="generateBtn">
        <span>Generate Reply</span>
        <div class="spinner" id="spinner"></div>
      </button>

      <div class="reply-section" id="replySection" style="display: none;">
        <div class="reply-label">GENERATED REPLY:</div>
        <div class="reply-box" id="replyBox"></div>
        <div class="reply-actions">
          <button class="action-btn" id="copyBtn">C<br>Copy</button>
          <button class="action-btn" id="humanizeBtn">H<br>Humanize</button>
          <button class="action-btn" id="autoPasteBtn">P<br>Auto Paste</button>
          <button class="action-btn" id="regenerateBtn">R<br>Regenerate</button>
          <button class="action-btn" id="editBtn">E<br>Edit</button>
          <button class="action-btn" id="exportDbBtn">D<br>Export</button>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="keyboard-shortcuts">
        <span class="shortcut-hint">Ctrl+Enter: Generate | Ctrl+C: Copy | 1-7: Quick Tones</span>
      </div>
      <span class="settings-link" id="settingsLink">Settings</span>
    </div>
  `;

  // Add event listeners
  setupPanelEventListeners();
}

// Setup panel event listeners
function setupPanelEventListeners() {
  // Tone selection
  document.querySelectorAll('.tone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTone = btn.dataset.tone;
      
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
  document.getElementById('humanizeBtn').addEventListener('click', humanizeReply);
  document.getElementById('autoPasteBtn').addEventListener('click', autoPasteReply);
  document.getElementById('regenerateBtn').addEventListener('click', generateReply);
  document.getElementById('editBtn').addEventListener('click', editReply);
  document.getElementById('exportDbBtn').addEventListener('click', exportToDatabase);

  // Feature buttons
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  document.getElementById('templatesBtn').addEventListener('click', showTemplates);
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('quickActionsBtn').addEventListener('click', showQuickActions);
  document.getElementById('contextBtn').addEventListener('click', showContext);

  // Settings and close
  document.getElementById('settingsLink').addEventListener('click', showSettings);
  document.getElementById('closeBtn').addEventListener('click', closePanel);
}

// Setup text selection monitoring with context
function setupTextSelection() {
document.addEventListener('mouseup', async () => {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
      selectedText = selection.toString().trim();
      console.log('Selected text:', selectedText);
      
      // Display selected text immediately
      const selectedTextElement = document.getElementById('selectedText');
      if (selectedTextElement) {
        selectedTextElement.textContent = selectedText;
      }
      
      // Show loading indicator for context button
      const contextBtn = document.getElementById('contextBtn');
      if (contextBtn) {
        contextBtn.style.display = 'flex';
        contextBtn.textContent = 'Loading Context...';
        contextBtn.disabled = true;
      }
      
      // Get context - find the original post and other replies (now async)
      const context = await getPostContext(selection.anchorNode);
      console.log('Context result:', context);
      
      // Store context for AI generation
      window.postContext = context;
      
      // Update context button
      if (contextBtn) {
        contextBtn.disabled = false;
        if (context && context.originalPost) {
          contextBtn.textContent = '👁 View Context';
          console.log('Showing context button');
        } else {
          contextBtn.style.display = 'none';
          console.log('Hiding context button');
        }
      } else {
        console.error('Context button not found!');
      }
    }
  });
}

// Get the full context of a post including original post and replies
async function getPostContext(selectedNode) {
  try {
    console.log('Getting context for selected node:', selectedNode);
    
    // Find the closest post container - try multiple strategies
    let postContainer = findPostContainer(selectedNode);
    
    if (!postContainer) {
      console.log('No post container found');
      return null;
    }
    
    console.log('Found post container:', postContainer);
    
    // Get the original post content
    const originalPost = getOriginalPostContent(postContainer);
    console.log('Original post:', originalPost);
    
    // Get all replies in the thread (now async)
    const replies = await getAllReplies(postContainer);
    console.log('Replies found:', replies.length);
    
    // Combine into context
    const context = {
      originalPost: originalPost,
      replies: replies,
      selectedReply: selectedText
    };
    
    console.log('Final context:', context);
    return context;
  } catch (error) {
    console.error('Error getting post context:', error);
    return null;
  }
}

// Find post container using multiple strategies
function findPostContainer(selectedNode) {
  console.log('Finding post container for node:', selectedNode);
  
  // Strategy 1: Look for the main feed post container (the actual post, not comments)
  let element = selectedNode;
  while (element && element !== document.body) {
    console.log('Checking element for main post container:', element.tagName, element.className);
    if (element.className && 
        element.className.includes('feed-shared-update-v2') && 
        !element.className.includes('comments-container') &&
        !element.className.includes('comments') &&
        !element.className.includes('feed-shared-update-v2__comments') &&
        !element.className.includes('feed-shared-update-v2__comments-container') &&
        !element.className.includes('feed-shared-update-v2__control-menu-container')) {
      console.log('Found main post container with Strategy 1:', element);
      return element;
    }
    element = element.parentElement;
  }
  
  // Strategy 2: Look for comment containers and find their parent post
  element = selectedNode;
  while (element && element !== document.body) {
    console.log('Checking element for comment container:', element.tagName, element.className);
    if (isCommentContainer(element)) {
      console.log('Found comment container, looking for parent post');
      const parentPost = findParentPost(element);
      if (parentPost) {
        console.log('Found parent post with Strategy 2:', parentPost);
        return parentPost;
      }
    }
    element = element.parentElement;
  }
  
  // Strategy 3: Look for the actual post content container
  element = selectedNode;
  while (element && element !== document.body) {
    console.log('Checking element for post content container:', element.tagName, element.className);
    if (element.className && element.className.includes('update-components-update-v2__commentary')) {
      console.log('Found post content container with Strategy 3:', element);
      // Find the parent feed-shared-update-v2 container
      let parent = element;
      while (parent && parent !== document.body) {
        if (parent.className && parent.className.includes('feed-shared-update-v2')) {
          console.log('Found parent feed container:', parent);
          return parent;
        }
        parent = parent.parentElement;
      }
    }
    element = element.parentElement;
  }
  
  // Strategy 4: Look for LinkedIn's specific post containers
  element = selectedNode;
  while (element && element !== document.body) {
    console.log('Checking element for post container:', element.tagName, element.className);
    if (isPostContainer(element)) {
      console.log('Found post container with Strategy 4:', element);
      return element;
    }
    element = element.parentElement;
  }
  
  // Strategy 5: Look for any element with post-like attributes
  element = selectedNode;
  while (element && element !== document.body) {
    console.log('Checking element for post attributes:', element.tagName, element.className);
    if (hasPostAttributes(element)) {
      console.log('Found post container with Strategy 5:', element);
      return element;
    }
    element = element.parentElement;
  }
  
  console.log('No post container found with any strategy');
  return null;
}

// Check if an element is a post container
function isPostContainer(element) {
  if (!element || !element.className) return false;
  
  const className = element.className.toLowerCase();
  const id = element.id ? element.id.toLowerCase() : '';
  const dataTestId = element.getAttribute('data-test-id') || '';
  
  return className.includes('feed-shared-update-v2') || 
         className.includes('post') || 
         className.includes('update') ||
         className.includes('feed-shared-update') ||
         className.includes('artdeco-card') ||
         id.includes('post') ||
         id.includes('update') ||
         dataTestId.includes('post') ||
         dataTestId.includes('update');
}

// Check if an element is a comment container
function isCommentContainer(element) {
  if (!element || !element.className) return false;
  
  const className = element.className.toLowerCase();
  const dataTestId = element.getAttribute('data-test-id') || '';
  
  return className.includes('comment') ||
         className.includes('reply') ||
         className.includes('feed-shared-comment') ||
         className.includes('comments-comment-item') ||
         dataTestId.includes('comment') ||
         dataTestId.includes('reply');
}

// Find parent post from a comment
function findParentPost(commentElement) {
  let element = commentElement;
  while (element && element !== document.body) {
    console.log('Looking for parent post:', element.tagName, element.className);
    if (element.className && 
        element.className.includes('feed-shared-update-v2') && 
        !element.className.includes('comments-container') &&
        !element.className.includes('comments') &&
        !element.className.includes('feed-shared-update-v2__comments') &&
        !element.className.includes('feed-shared-update-v2__comments-container') &&
        !element.className.includes('feed-shared-update-v2__control-menu-container')) {
      console.log('Found parent post:', element);
      return element;
    }
    element = element.parentElement;
  }
  console.log('No parent post found');
  return null;
}

// Check if element has post-like attributes
function hasPostAttributes(element) {
  if (!element) return false;
  
  // Check for LinkedIn-specific data attributes
  const dataAttributes = [
    'data-urn',
    'data-post-id',
    'data-update-id',
    'data-activity-id'
  ];
  
  for (const attr of dataAttributes) {
    if (element.hasAttribute(attr)) {
      return true;
    }
  }
  
  // Check for role attributes
  const role = element.getAttribute('role');
  if (role && (role.includes('article') || role.includes('post'))) {
    return true;
  }
  
  return false;
}

// Get the original post content
function getOriginalPostContent(postContainer) {
  try {
    console.log('Looking for post content in:', postContainer);
    
    // Look for the main post text content using the exact class from the HTML
    const postTextElement = postContainer.querySelector('.update-components-text.relative.update-components-update-v2__commentary');
    if (postTextElement) {
      const text = postTextElement.textContent.trim();
      if (isValidPostContent(text)) {
        console.log('Found post content in main text element:', text.substring(0, 100) + '...');
        return text;
      }
    }
    
    // Fallback: look for the description container
    const descriptionElement = postContainer.querySelector('.feed-shared-inline-show-more-text.feed-shared-update-v2__description');
    if (descriptionElement) {
      const text = descriptionElement.textContent.trim();
      if (isValidPostContent(text)) {
        console.log('Found post content in description:', text.substring(0, 100) + '...');
        return text;
      }
    }
    
    // Another fallback: look for any text in the break-words container
    const breakWordsElement = postContainer.querySelector('.break-words.tvm-parent-container');
    if (breakWordsElement) {
      const text = breakWordsElement.textContent.trim();
      if (isValidPostContent(text)) {
        console.log('Found post content in break-words:', text.substring(0, 100) + '...');
        return text;
      }
    }
    
    console.log('No valid post content found');
    return null;
  } catch (error) {
    console.error('Error getting original post content:', error);
    return null;
  }
}

// Validate if text looks like actual post content
function isValidPostContent(text) {
  if (!text || text.length < 10) return false;
  
  console.log('Validating post content:', text.substring(0, 100) + '...');
  
  // Check for UI elements that should be excluded
  const uiElements = [
    'like', 'comment', 'share', 'follow', 'report', 'view', 'show more', 'show less',
    'add a comment', 'emoji keyboard', 'open emoji keyboard', 'post', 'reply',
    'most relevant', 'top', 'recent', 'sort by', 'filter', 'notifications',
    'messages', 'network', 'home', 'me', 'premium', 'try premium',
    'load more comments', 'see more', 'see less'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Only reject if the text consists primarily of UI elements
  // Check if the text is mostly UI elements by counting matches
  let uiElementCount = 0;
  for (const uiElement of uiElements) {
    if (lowerText.includes(uiElement)) {
      uiElementCount++;
    }
  }
  
  // If more than 50% of the text consists of UI elements, reject it
  const words = text.split(/\s+/).length;
  const uiElementRatio = uiElementCount / words;
  
  if (uiElementRatio > 0.5) {
    console.log('Rejected due to high UI element ratio:', uiElementRatio);
    return false;
  }
  
  // Also reject if the text is very short and contains UI elements
  if (text.length < 50 && uiElementCount > 0) {
    console.log('Rejected short text with UI elements');
    return false;
  }
  
  // Check for patterns that indicate UI elements
  if (text.match(/^\d+$/) || // Just numbers
      text.match(/^[A-Z\s]+$/) || // Just uppercase (like "FOLLOW")
      text.match(/^[•\-\*]\s*$/) || // Just bullet points
      text.match(/^[a-z\s]+$/) && text.length < 30 || // Just lowercase short text
      text.includes('•') && text.length < 50 // Short text with bullets
  ) {
    console.log('Rejected due to pattern match');
    return false;
  }
  
  // Check if text looks like actual content (has proper sentence structure)
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) {
    console.log('Rejected: no sentences found');
    return false;
  }
  
  // At least one sentence should be substantial
  const hasSubstantialSentence = sentences.some(sentence => 
    sentence.trim().length > 5 && 
    sentence.trim().split(' ').length > 2
  );
  
  if (!hasSubstantialSentence) {
    console.log('Rejected: no substantial sentences');
    return false;
  }
  
  console.log('Post content validation passed');
  return true;
}

// Get all replies in the thread
async function getAllReplies(postContainer) {
  try {
    console.log('Looking for replies in:', postContainer);
    const replies = [];
    
    // First, try to load more comments if available
    await loadMoreComments(postContainer);
    
    // Look for comment content using the exact classes from the HTML
    const commentElements = postContainer.querySelectorAll('.comments-comment-item__main-content.feed-shared-main-content--comment');
    console.log(`Found ${commentElements.length} comment elements`);
    
    commentElements.forEach((element, index) => {
      const replyText = element.textContent.trim();
      if (isValidReplyContent(replyText)) {
        console.log(`Reply ${index + 1}:`, replyText.substring(0, 100) + '...');
        replies.push(replyText);
      }
    });
    
    // Also look for quick comment buttons (like "Thanks for sharing, MD.")
    const quickCommentButtons = postContainer.querySelectorAll('.comments-quick-comments__reply-button');
    console.log(`Found ${quickCommentButtons.length} quick comment buttons`);
    
    quickCommentButtons.forEach((button, index) => {
      const replyText = button.textContent.trim();
      if (isValidReplyContent(replyText)) {
        console.log(`Quick reply ${index + 1}:`, replyText.substring(0, 100) + '...');
        replies.push(replyText);
      }
    });
    
    console.log(`Total replies found: ${replies.length}`);
    return replies;
  } catch (error) {
    console.error('Error getting replies:', error);
    return [];
  }
}

// Load more comments if available
async function loadMoreComments(postContainer) {
  try {
    let commentsLoaded = 0;
    
    // Look for various "Load more comments" buttons
    const loadMoreSelectors = [
      '.comments-comments-list__load-more-comments-button--cr',
      '.comments-comments-list__load-more-comments-arrows',
      'button[aria-label*="Load more comments"]',
      'button[aria-label*="load more"]',
      'button:contains("Load more")',
      'button:contains("load more")'
    ];
    
    let loadMoreButton = null;
    for (const selector of loadMoreSelectors) {
      loadMoreButton = postContainer.querySelector(selector);
      if (loadMoreButton && !loadMoreButton.disabled) {
        break;
      }
    }
    
    // Also check for buttons with text content
    if (!loadMoreButton) {
      const allButtons = postContainer.querySelectorAll('button');
      for (const button of allButtons) {
        const buttonText = button.textContent.toLowerCase();
        if ((buttonText.includes('load more') || buttonText.includes('show more')) && 
            !button.disabled && 
            !buttonText.includes('less')) {
          loadMoreButton = button;
          break;
        }
      }
    }
    
    if (loadMoreButton && !loadMoreButton.disabled) {
      console.log('Found "Load more comments" button, clicking it...');
      loadMoreButton.click();
      commentsLoaded++;
      
      // Update context button to show loading progress
      const contextBtn = document.getElementById('contextBtn');
      if (contextBtn) {
        contextBtn.textContent = `Loading... (${commentsLoaded})`;
      }
      
      // Wait for new comments to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if there are more comments to load and continue loading
      await loadMoreComments(postContainer);
    }
    
    // Also check for "View more" buttons in individual comments
    const viewMoreSelectors = [
      '.feed-shared-inline-show-more-text__see-more-less-toggle',
      'button[aria-label*="see more"]',
      'button[aria-label*="show more"]'
    ];
    
    for (const selector of viewMoreSelectors) {
      const viewMoreButtons = postContainer.querySelectorAll(selector);
      for (const button of viewMoreButtons) {
        const buttonText = button.textContent.toLowerCase();
        if ((buttonText.includes('more') || buttonText.includes('…more')) && 
            !buttonText.includes('less') && 
            !button.disabled) {
          console.log('Found "View more" button, clicking it...');
          button.click();
          commentsLoaded++;
          
          // Update context button to show loading progress
          const contextBtn = document.getElementById('contextBtn');
          if (contextBtn) {
            contextBtn.textContent = `Loading... (${commentsLoaded})`;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    // Also check for any button with "more" text that might be a view more button
    const allButtons = postContainer.querySelectorAll('button');
    for (const button of allButtons) {
      const buttonText = button.textContent.toLowerCase();
      if ((buttonText.includes('…more') || buttonText.includes('more')) && 
          !buttonText.includes('less') && 
          !button.disabled &&
          button.offsetWidth > 0 && // Make sure button is visible
          button.offsetHeight > 0) {
        console.log('Found additional "more" button, clicking it...');
        button.click();
        commentsLoaded++;
        
        // Update context button to show loading progress
        const contextBtn = document.getElementById('contextBtn');
        if (contextBtn) {
          contextBtn.textContent = `Loading... (${commentsLoaded})`;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (commentsLoaded > 0) {
      console.log(`Loaded ${commentsLoaded} additional comment sections`);
    }
    
  } catch (error) {
    console.error('Error loading more comments:', error);
  }
}

// Validate if text looks like actual reply content
function isValidReplyContent(text) {
  if (!text || text.length < 5) return false;
  
  // Check for UI elements that should be excluded
  const uiElements = [
    'like', 'reply', 'share', 'follow', 'report', 'view', 'show more', 'show less',
    'add a comment', 'emoji keyboard', 'open emoji keyboard', 'post', 'comment',
    'most relevant', 'top', 'recent', 'sort by', 'filter', 'search', 'notifications',
    'messages', 'jobs', 'network', 'home', 'me', 'premium', 'try premium'
  ];
  
  const lowerText = text.toLowerCase();
  for (const uiElement of uiElements) {
    if (lowerText.includes(uiElement)) {
      return false;
    }
  }
  
  // Check for patterns that indicate UI elements
  if (text.match(/^\d+$/) || // Just numbers
      text.match(/^[A-Z\s]+$/) || // Just uppercase (like "FOLLOW")
      text.match(/^[•\-\*]\s*$/) || // Just bullet points
      text.includes('•') && text.length < 50 // Short text with bullets
  ) {
    return false;
  }
  
  // Check if it looks like actual reply content
  // Should have some meaningful text, not just UI elements
  const words = text.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) return false;
  
  // Should not be just punctuation or special characters
  const hasMeaningfulContent = words.some(word => 
    word.length > 1 && 
    !word.match(/^[^\w\s]+$/) // Not just punctuation
  );
  
  return hasMeaningfulContent;
}

// Open panel
function openPanel() {
  console.log("Opening panel...");
  const panel = document.getElementById('linkedin-ai-panel');
  console.log("Panel element:", panel);
  if (panel) {
    panel.style.right = '0';
    panel.classList.add('open');
    document.body.classList.add('panel-open');
    isPanelOpen = true;
    console.log("Panel opened, isPanelOpen:", isPanelOpen);
    
    const toggleBtn = document.getElementById('linkedin-ai-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = 'Close<br>Panel';
      toggleBtn.title = 'Close PostPen Extension';
    }
  } else {
    console.error("Panel element not found!");
  }
}

// Close panel
function closePanel() {
  console.log("Closing panel...");
  const panel = document.getElementById('linkedin-ai-panel');
  if (panel) {
    panel.style.right = '-400px';
    panel.classList.remove('open');
    document.body.classList.remove('panel-open');
    isPanelOpen = false;
    console.log("Panel closed, isPanelOpen:", isPanelOpen);
    
    const toggleBtn = document.getElementById('linkedin-ai-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = 'P<br>PostPen';
      toggleBtn.title = 'Open PostPen Extension';
    }
  } else {
    console.error("Panel element not found!");
  }
}

// Load settings from storage
function loadSettings() {
  // Use background script to access storage
  chrome.runtime.sendMessage({action: "getSettings"}, (result) => {
    if (result && result.geminiKey) {
      console.log('API key found');
    }
    
    if (result && result.darkMode) {
      isDarkMode = result.darkMode;
      applyDarkMode();
    }
    
    if (result && result.replyHistory) {
      replyHistory = result.replyHistory;
    }
    if (result && result.savedTemplates) {
      savedTemplates = result.savedTemplates;
    }
  });
}

// Toggle dark mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  applyDarkMode();
  chrome.storage.sync.set({ darkMode: isDarkMode });
}

// Apply dark mode styles
function applyDarkMode() {
  const panel = document.getElementById('linkedin-ai-panel');
  if (isDarkMode) {
    panel.classList.add('dark-mode');
    document.getElementById('darkModeBtn').innerHTML = '<span class="action-icon">L</span>Light';
  } else {
    panel.classList.remove('dark-mode');
    document.getElementById('darkModeBtn').innerHTML = '<span class="action-icon">D</span>Dark';
  }
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

  generateBtn.disabled = true;
  spinner.style.display = 'block';
  replySection.style.display = 'none';

  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({action: "getApiKey"}, (response) => {
        resolve(response);
      });
    });
    
    if (!result || !result.apiKey) {
      alert('Please set your Gemini API key in settings');
      return;
    }

    const options = getOptions();
    const prompt = createPrompt(selectedText, selectedTone, options);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${result.apiKey}`, {
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

    document.getElementById('replyBox').textContent = aiReply;
    replySection.style.display = 'block';

  } catch (error) {
    console.error('Error generating reply:', error);
    alert(`Error: ${error.message}`);
  } finally {
    generateBtn.disabled = false;
    spinner.style.display = 'none';
  }
}

// Get current options
function getOptions() {
  return {
    length: document.getElementById('lengthSlider').value,
    isOwner: document.getElementById('isOwner').checked,
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
  
  // Add context if available
  if (window.postContext && window.postContext.originalPost) {
    prompt = `CONTEXT:\nOriginal Post: "${window.postContext.originalPost}"\n\n`;
    
    if (window.postContext.replies && window.postContext.replies.length > 0) {
      prompt += `Other replies in the thread:\n`;
      window.postContext.replies.forEach((reply, index) => {
        prompt += `- Reply ${index + 1}: "${reply}"\n`;
      });
      prompt += '\n';
    }
    
    prompt += `You are replying to: "${text}"\n\n`;
  }
  
  // Add owner context if enabled
  if (options.isOwner) {
    prompt += `IMPORTANT: You are the owner/author of the original post. Respond as the person who created this post, showing appreciation, engagement, and authority. `;
  }
  
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
  
  const lengths = { '1': 'short', '2': 'medium', '3': 'long' };
  prompt += `Make it ${lengths[options.length]} length. `;
  
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
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = 'C<br>Copied!';
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
  
  replyBox.style.display = 'none';
  replyBox.parentNode.insertBefore(textarea, replyBox);
  
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

// Humanize reply - make it sound more natural
async function humanizeReply() {
  const replyBox = document.getElementById('replyBox');
  const currentText = replyBox.textContent;
  
  if (!currentText || currentText === 'No text selected') {
    alert('No reply to humanize');
    return;
  }
  
  const humanizeBtn = document.getElementById('humanizeBtn');
  const originalText = humanizeBtn.innerHTML;
  humanizeBtn.innerHTML = 'H<br>Processing...';
  humanizeBtn.disabled = true;
  
  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({action: "getApiKey"}, (response) => {
        resolve(response);
      });
    });
    
    if (!result || !result.apiKey) {
      alert('Please set your Gemini API key in settings');
      return;
    }
    
    const humanizePrompt = `Make this LinkedIn reply sound more natural and human. Use casual, conversational language like a real person would write. Avoid formal AI language, excessive punctuation, and quotes. Keep it friendly and authentic:

${currentText}

Rewrite this to sound like a real person wrote it naturally:`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${result.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: humanizePrompt }] }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const humanizedReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (humanizedReply) {
      replyBox.textContent = humanizedReply;
      // Save to history
      saveToHistory(humanizedReply);
    } else {
      alert('Failed to humanize reply');
    }
    
  } catch (error) {
    console.error('Error humanizing reply:', error);
    alert('Error humanizing reply: ' + error.message);
  } finally {
    humanizeBtn.innerHTML = originalText;
    humanizeBtn.disabled = false;
  }
}

// Auto paste reply to LinkedIn
async function autoPasteReply() {
  const replyBox = document.getElementById('replyBox');
  const replyText = replyBox.textContent;
  
  if (!replyText || replyText === 'No text selected') {
    alert('No reply to paste');
    return;
  }
  
  try {
    // Find LinkedIn comment/reply input fields
    const commentInputs = document.querySelectorAll('textarea[placeholder*="comment"], textarea[placeholder*="reply"], textarea[placeholder*="Add a comment"], textarea[placeholder*="Write a comment"], textarea[placeholder*="Start a post"], div[contenteditable="true"]');
    
    if (commentInputs.length === 0) {
      alert('No comment input found. Please click on a comment box or post input first.');
      return;
    }
    
    // Try to find the most likely input (prioritize comment inputs)
    let targetInput = null;
    
    // First, try to find comment/reply inputs
    for (let input of commentInputs) {
      const placeholder = input.placeholder?.toLowerCase() || '';
      if (placeholder.includes('comment') || placeholder.includes('reply')) {
        targetInput = input;
        break;
      }
    }
    
    // If no comment input found, use the first available input
    if (!targetInput) {
      targetInput = commentInputs[0];
    }
    
    // Focus on the input
    targetInput.focus();
    
    // Clear existing content and paste the reply
    if (targetInput.tagName === 'TEXTAREA') {
      targetInput.value = replyText;
    } else if (targetInput.contentEditable === 'true') {
      targetInput.textContent = replyText;
    }
    
    // Trigger input events to make LinkedIn recognize the change
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Show success message
    const autoPasteBtn = document.getElementById('autoPasteBtn');
    const originalText = autoPasteBtn.innerHTML;
    autoPasteBtn.innerHTML = 'P<br>Pasted!';
    autoPasteBtn.style.background = '#4CAF50';
    
    setTimeout(() => {
      autoPasteBtn.innerHTML = originalText;
      autoPasteBtn.style.background = '';
    }, 2000);
    
  } catch (error) {
    console.error('Error auto-pasting reply:', error);
    alert('Error auto-pasting reply: ' + error.message);
  }
}

// Save reply to history
function saveToHistory(reply) {
  replyHistory.unshift(reply);
  if (replyHistory.length > 50) {
    replyHistory.pop();
  }
  chrome.runtime.sendMessage({action: "saveHistory", history: replyHistory});
}

// Export reply and context to database
async function exportToDatabase() {
  const replyText = document.getElementById('replyBox').textContent.trim();
  if (!replyText) {
    alert('No reply to export');
    return;
  }
  
  const exportBtn = document.getElementById('exportDbBtn');
  const originalText = exportBtn.innerHTML;
  exportBtn.innerHTML = 'D<br>Exporting...';
  exportBtn.disabled = true;
  
  try {
    // Prepare data for export
    const exportData = {
      reply: replyText,
      selectedText: selectedText,
      context: window.postContext,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      tone: selectedTone,
      length: document.querySelector('.current-length').textContent,
      isOwner: document.getElementById('isOwner') ? document.getElementById('isOwner').checked : false
    };
    
    // Send to background script for database export
    const result = await chrome.runtime.sendMessage({
      action: "exportToDatabase",
      data: exportData
    });
    
    if (result.success) {
      exportBtn.innerHTML = 'D<br>Exported!';
      exportBtn.style.background = '#4CAF50';
      setTimeout(() => {
        exportBtn.innerHTML = originalText;
        exportBtn.style.background = '';
        exportBtn.disabled = false;
      }, 2000);
    } else {
      throw new Error(result.error || 'Export failed');
    }
    
  } catch (error) {
    console.error('Export error:', error);
    alert('Export failed: ' + error.message);
    exportBtn.innerHTML = originalText;
    exportBtn.disabled = false;
  }
}

// Show history
function showHistory() {
  alert('History feature coming soon!');
}

// Show templates
function showTemplates() {
  alert('Templates feature coming soon!');
}

// Show quick actions
function showQuickActions() {
  alert('Quick Actions feature coming soon!');
}

// Show context modal
function showContext() {
  if (!window.postContext) {
    alert('No context available');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'context-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `;
  
  const context = window.postContext;
  let contextContent = '';
  
  if (context.originalPost) {
    contextContent += `<div class="context-section" style="
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #f7931e;
    ">
      <h3 style="
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 10px 0;
        display: flex;
        align-items: center;
        gap: 6px;
      ">📝 Original Post:</h3>
      <div style="
        font-size: 12px;
        line-height: 1.4;
        color: #555;
        max-height: 150px;
        overflow-y: auto;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      ">${context.originalPost}</div>
    </div>`;
  }
  
  if (context.replies && context.replies.length > 0) {
    contextContent += `<div class="context-section" style="
      margin-bottom: 20px;
      padding: 15px;
      background: #e8f4fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    ">
      <h3 style="
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 10px 0;
        display: flex;
        align-items: center;
        gap: 6px;
      ">💭 Other Replies (${context.replies.length}):</h3>
      <div class="replies-table-container" style="
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        margin-top: 10px;
      ">
        <table class="replies-table" style="
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        ">
          <thead style="background: #f8f8f8; position: sticky; top: 0;">
            <tr>
              <th style="
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
                font-weight: 600;
                color: #333;
                width: 60px;
              ">#</th>
              <th style="
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
                font-weight: 600;
                color: #333;
              ">Reply Content</th>
            </tr>
          </thead>
          <tbody>`;
    context.replies.forEach((reply, index) => {
      const truncatedReply = reply.length > 150 ? reply.substring(0, 150) + '...' : reply;
      contextContent += `<tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="
          padding: 8px;
          font-weight: 600;
          color: #666;
          vertical-align: top;
        ">${index + 1}</td>
        <td style="
          padding: 8px;
          line-height: 1.4;
          color: #333;
        ">${truncatedReply}</td>
      </tr>`;
    });
    contextContent += `</tbody></table></div></div>`;
  }
  
  if (context.selectedReply) {
    contextContent += `<div class="context-section" style="
      margin-bottom: 20px;
      padding: 15px;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    ">
      <h3 style="
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 10px 0;
        display: flex;
        align-items: center;
        gap: 6px;
      ">💬 You're Replying To:</h3>
      <div style="
        font-size: 12px;
        line-height: 1.4;
        color: #555;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
        font-weight: 500;
      ">${context.selectedReply}</div>
    </div>`;
  }
  
  modal.innerHTML = `
    <div class="context-content" style="
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 600px;
      max-height: 70vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div class="context-title" style="
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 2px solid #f7931e;
      ">
        <span>📋 Context Information</span>
        <button id="closeContextBtn" style="
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">×</button>
      </div>
      <div class="context-body" style="
        font-size: 13px;
        line-height: 1.4;
        color: #333;
      ">
        ${contextContent}
      </div>
      <div class="context-footer" style="
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        font-size: 11px;
        color: #888;
        text-align: center;
        font-style: italic;
      ">
        This context will be used to generate more relevant replies.
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add close button event listener
  modal.querySelector('#closeContextBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Show settings modal
function showSettings() {
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `;
  
  modal.innerHTML = `
    <div class="settings-content" style="
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div class="settings-title" style="
        font-size: 16px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 20px;
        text-align: center;
        padding-bottom: 10px;
        border-bottom: 2px solid #f7931e;
      ">⚙️ Settings</div>
      
      <!-- API Settings Section -->
      <div class="settings-section" style="
        margin-bottom: 25px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #f7931e;
      ">
        <h3 style="
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        ">🔑 API Settings</h3>
        <input type="password" class="api-key-input" id="apiKeyInput" placeholder="Enter Gemini API key" style="
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 12px;
          box-sizing: border-box;
        ">
        <button class="settings-btn" id="saveApiKey" style="
          width: 100%;
          background: #f7931e;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#e67e22'" onmouseout="this.style.backgroundColor='#f7931e'">Save API Key</button>
      </div>
      
      <!-- Database Settings Section -->
      <div class="settings-section" style="
        margin-bottom: 25px;
        padding: 15px;
        background: #e8f4fd;
        border-radius: 8px;
        border-left: 4px solid #2196f3;
      ">
        <h3 style="
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        ">🗄️ Database Settings</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <input type="text" class="db-input" id="dbHostInput" placeholder="Host (localhost)" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 12px;
            box-sizing: border-box;
          ">
          <input type="text" class="db-input" id="dbPortInput" placeholder="Port (3306)" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 12px;
            box-sizing: border-box;
          ">
        </div>
        <input type="text" class="db-input" id="dbNameInput" placeholder="Database Name" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 8px;
          box-sizing: border-box;
        ">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <input type="text" class="db-input" id="dbUserInput" placeholder="Username" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 12px;
            box-sizing: border-box;
          ">
          <input type="password" class="db-input" id="dbPassInput" placeholder="Password" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 12px;
            box-sizing: border-box;
          ">
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="settings-btn" id="testDbConnection" style="
            flex: 1;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#45a049'" onmouseout="this.style.backgroundColor='#4CAF50'">Test Connection</button>
          <button class="settings-btn" id="saveDbSettings" style="
            flex: 1;
            background: #f7931e;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          " onmouseover="this.style.backgroundColor='#e67e22'" onmouseout="this.style.backgroundColor='#f7931e'">Save Settings</button>
        </div>
      </div>
      
      <button class="settings-btn" id="closeSettings" style="
        width: 100%;
        background: #666;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      " onmouseover="this.style.backgroundColor='#555'" onmouseout="this.style.backgroundColor='#666'">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load existing settings
  chrome.runtime.sendMessage({action: "getSettings"}, (result) => {
    if (result) {
      if (result.apiKey) {
        document.getElementById('apiKeyInput').value = result.apiKey;
      }
      if (result.dbHost) {
        document.getElementById('dbHostInput').value = result.dbHost;
      }
      if (result.dbPort) {
        document.getElementById('dbPortInput').value = result.dbPort;
      }
      if (result.dbName) {
        document.getElementById('dbNameInput').value = result.dbName;
      }
      if (result.dbUser) {
        document.getElementById('dbUserInput').value = result.dbUser;
      }
      if (result.dbPass) {
        document.getElementById('dbPassInput').value = result.dbPass;
      }
    }
  });
  
  // Save API Key
  document.getElementById('saveApiKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (apiKey) {
      chrome.runtime.sendMessage({action: "saveApiKey", apiKey: apiKey}, () => {
        alert('API key saved successfully!');
      });
    } else {
      alert('Please enter an API key');
    }
  });
  
  // Test Database Connection
  document.getElementById('testDbConnection').addEventListener('click', async () => {
    const dbConfig = getDatabaseConfig();
    if (!dbConfig) return;
    
    const testBtn = document.getElementById('testDbConnection');
    const originalText = testBtn.textContent;
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    
    try {
      const result = await chrome.runtime.sendMessage({
        action: "testDbConnection", 
        dbConfig: dbConfig
      });
      
      if (result.success) {
        alert('Database connection successful!');
      } else {
        alert('Database connection failed: ' + result.error);
      }
    } catch (error) {
      alert('Error testing connection: ' + error.message);
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  });
  
  // Save Database Settings
  document.getElementById('saveDbSettings').addEventListener('click', () => {
    const dbConfig = getDatabaseConfig();
    if (!dbConfig) return;
    
    chrome.runtime.sendMessage({
      action: "saveDbSettings", 
      dbConfig: dbConfig
    }, () => {
      alert('Database settings saved successfully!');
    });
  });
  
  // Helper function to get database config from form
  function getDatabaseConfig() {
    const host = document.getElementById('dbHostInput').value.trim();
    const port = document.getElementById('dbPortInput').value.trim();
    const name = document.getElementById('dbNameInput').value.trim();
    const user = document.getElementById('dbUserInput').value.trim();
    const pass = document.getElementById('dbPassInput').value.trim();
    
    if (!host || !port || !name || !user) {
      alert('Please fill in all database fields');
      return null;
    }
    
    return { host, port, name, user, pass };
  }
  
  // Close Settings
  document.getElementById('closeSettings').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'togglePanel') {
    console.log('Received toggle panel message');
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSidePanel);
} else {
  initializeSidePanel();
}
  