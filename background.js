// Background script to handle storage access and extension icon clicks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getApiKey") {
    chrome.storage.sync.get("geminiKey", (result) => {
      sendResponse({ apiKey: result.geminiKey });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "getSettings") {
    chrome.storage.sync.get(['geminiKey', 'darkMode', 'replyHistory', 'savedTemplates', 'dbHost', 'dbPort', 'dbName', 'dbUser', 'dbPass'], (result) => {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "saveApiKey") {
    chrome.storage.sync.set({ geminiKey: request.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "saveDbSettings") {
    chrome.storage.sync.set({
      dbHost: request.dbConfig.host,
      dbPort: request.dbConfig.port,
      dbName: request.dbConfig.name,
      dbUser: request.dbConfig.user,
      dbPass: request.dbConfig.pass
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "testDbConnection") {
    testDatabaseConnection(request.dbConfig).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "exportToDatabase") {
    exportToDatabase(request.data).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "storeApiKey") {
    storeApiKey(request.keyName, request.keyValue).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "getApiKeyFromDb") {
    getApiKeyFromDb(request.keyName).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === "saveHistory") {
    chrome.storage.sync.set({ replyHistory: request.history }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Only work on LinkedIn pages
  if (tab.url && tab.url.includes('linkedin.com')) {
    try {
      // Inject the content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Send message to toggle the panel
      await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
    } catch (error) {
      console.log('Content script already injected or error:', error);
      // Try to send the toggle message anyway
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
      } catch (e) {
        console.log('Could not send toggle message:', e);
    }
  }
  } else {
    // Show a notification for non-LinkedIn pages
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 2000);
  }
});

// Database connection and export functions
async function testDatabaseConnection(dbConfig) {
  try {
    // For Chrome extensions, we need to use a server-side API to connect to MySQL
    // This is a placeholder implementation - you'll need to set up a server endpoint
    
    const response = await fetch('http://localhost:3000/api/test-db-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbConfig)
    });
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { success: false, error: error.message };
  }
}

async function exportToDatabase(data) {
  try {
    // Get database settings from storage
    const dbSettings = await new Promise((resolve) => {
      chrome.storage.sync.get(['dbHost', 'dbPort', 'dbName', 'dbUser', 'dbPass'], resolve);
    });
    
    if (!dbSettings.dbHost || !dbSettings.dbPort || !dbSettings.dbName || !dbSettings.dbUser) {
      throw new Error('Database settings not configured. Please configure database settings first.');
    }
    
    // Prepare the export payload
    const exportPayload = {
      dbConfig: {
        host: dbSettings.dbHost,
        port: dbSettings.dbPort,
        name: dbSettings.dbName,
        user: dbSettings.dbUser,
        pass: dbSettings.dbPass
      },
      data: data
    };
    
    // Send to server for database insertion
    const response = await fetch('http://localhost:3000/api/export-to-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportPayload)
    });
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Database export failed:', error);
    return { success: false, error: error.message };
  }
}

// Store API key in database
async function storeApiKey(keyName, keyValue) {
  try {
    // Get database settings from storage
    const dbSettings = await new Promise((resolve) => {
      chrome.storage.sync.get(['dbHost', 'dbPort', 'dbName', 'dbUser', 'dbPass'], resolve);
    });
    
    if (!dbSettings.dbHost || !dbSettings.dbPort || !dbSettings.dbName || !dbSettings.dbUser) {
      throw new Error('Database settings not configured. Please configure database settings first.');
    }
    
    // Prepare the payload
    const payload = {
      dbConfig: {
        host: dbSettings.dbHost,
        port: dbSettings.dbPort,
        name: dbSettings.dbName,
        user: dbSettings.dbUser,
        pass: dbSettings.dbPass
      },
      keyName: keyName,
      keyValue: keyValue
    };
    
    // Send to server for storage
    const response = await fetch('http://localhost:3000/api/store-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Store API key failed:', error);
    return { success: false, error: error.message };
  }
}

// Get API key from database
async function getApiKeyFromDb(keyName) {
  try {
    // Get database settings from storage
    const dbSettings = await new Promise((resolve) => {
      chrome.storage.sync.get(['dbHost', 'dbPort', 'dbName', 'dbUser', 'dbPass'], resolve);
    });
    
    if (!dbSettings.dbHost || !dbSettings.dbPort || !dbSettings.dbName || !dbSettings.dbUser) {
      throw new Error('Database settings not configured. Please configure database settings first.');
    }
    
    // Prepare the payload
    const payload = {
      dbConfig: {
        host: dbSettings.dbHost,
        port: dbSettings.dbPort,
        name: dbSettings.dbName,
        user: dbSettings.dbUser,
        pass: dbSettings.dbPass
      },
      keyName: keyName
    };
    
    // Send to server for retrieval
    const response = await fetch('http://localhost:3000/api/get-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Get API key failed:', error);
    return { success: false, error: error.message };
  }
} 