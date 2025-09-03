const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
let dbPool = null;

// Initialize database connection
async function initializeDatabase(dbConfig) {
  try {
    dbPool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.pass,
      database: dbConfig.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test the connection
    await dbPool.getConnection();
    
    // Create tables if they don't exist
    await createTables();
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Create necessary tables
async function createTables() {
  const createRepliesTable = `
    CREATE TABLE IF NOT EXISTS linkedin_replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reply_text TEXT NOT NULL,
      selected_text TEXT,
      original_post TEXT,
      context_replies JSON,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      url VARCHAR(500),
      tone VARCHAR(50),
      length VARCHAR(20),
      is_owner BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  const createApiKeysTable = `
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) NOT NULL UNIQUE,
      key_value TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await dbPool.execute(createRepliesTable);
    await dbPool.execute(createApiKeysTable);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Test database connection endpoint
app.post('/api/test-db-connection', async (req, res) => {
  try {
    const dbConfig = req.body;
    const success = await initializeDatabase(dbConfig);
    
    if (success) {
      res.json({ success: true, message: 'Database connection successful' });
    } else {
      res.json({ success: false, error: 'Database connection failed' });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Export to database endpoint
app.post('/api/export-to-database', async (req, res) => {
  try {
    const { dbConfig, data } = req.body;
    
    // Initialize database if not already done
    if (!dbPool) {
      const success = await initializeDatabase(dbConfig);
      if (!success) {
        throw new Error('Database connection failed');
      }
    }
    
    // Insert data into database
    const insertQuery = `
      INSERT INTO linkedin_replies (
        reply_text, 
        selected_text, 
        original_post, 
        context_replies, 
        url, 
        tone, 
        length, 
        is_owner
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.reply,
      data.selectedText,
      data.context?.originalPost || null,
      JSON.stringify(data.context?.replies || []),
      data.url,
      data.tone,
      data.length,
      data.isOwner
    ];
    
    const [result] = await dbPool.execute(insertQuery, values);
    
    res.json({ 
      success: true, 
      message: 'Data exported successfully',
      id: result.insertId 
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get all exports endpoint
app.get('/api/exports', async (req, res) => {
  try {
    if (!dbPool) {
      throw new Error('Database not connected');
    }
    
    const [rows] = await dbPool.execute('SELECT * FROM linkedin_replies ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
    
  } catch (error) {
    console.error('Get exports error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Store API key endpoint
app.post('/api/store-api-key', async (req, res) => {
  try {
    const { dbConfig, keyName, keyValue } = req.body;
    
    // Initialize database if not already done
    if (!dbPool) {
      const success = await initializeDatabase(dbConfig);
      if (!success) {
        throw new Error('Database connection failed');
      }
    }
    
    // Insert or update API key
    const upsertQuery = `
      INSERT INTO api_keys (key_name, key_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)
    `;
    
    await dbPool.execute(upsertQuery, [keyName, keyValue]);
    
    res.json({ 
      success: true, 
      message: 'API key stored successfully'
    });
    
  } catch (error) {
    console.error('Store API key error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get API key endpoint
app.post('/api/get-api-key', async (req, res) => {
  try {
    const { dbConfig, keyName } = req.body;
    
    // Initialize database if not already done
    if (!dbPool) {
      const success = await initializeDatabase(dbConfig);
      if (!success) {
        throw new Error('Database connection failed');
      }
    }
    
    // Get API key
    const [rows] = await dbPool.execute('SELECT key_value FROM api_keys WHERE key_name = ?', [keyName]);
    
    if (rows.length > 0) {
      res.json({ 
        success: true, 
        keyValue: rows[0].key_value 
      });
    } else {
      res.json({ 
        success: false, 
        error: 'API key not found' 
      });
    }
    
  } catch (error) {
    console.error('Get API key error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  POST /api/test-db-connection');
  console.log('  POST /api/export-to-database');
  console.log('  GET  /api/exports');
  console.log('  POST /api/store-api-key');
  console.log('  POST /api/get-api-key');
  console.log('  GET  /health');
}); 