# PostPen Extension - Database Integration

This Chrome extension now includes MySQL database integration for storing generated replies and context data.

## Features Added

### 🔧 Database Settings
- **MySQL Connection**: Configure host, port, database name, username, and password
- **Connection Testing**: Test database connectivity before saving settings
- **Secure Storage**: Database credentials stored securely in Chrome storage

### 📊 Export to Database
- **One-Click Export**: Export generated replies and context to MySQL database
- **Complete Context**: Stores original post, all replies, selected text, and metadata
- **Rich Metadata**: Includes tone, length, URL, timestamp, and owner status

## Setup Instructions

### 1. Database Setup
1. **Install MySQL** on your system or use a cloud MySQL service
2. **Create a database** for storing the extension data
3. **Create a user** with appropriate permissions for the database

### 2. Server Setup
1. **Install Node.js** (version 14 or higher)
2. **Navigate to the project directory**:
   ```bash
   cd linkedin-ai-replier
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the server**:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000`

### 3. Extension Setup
1. **Load the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension folder
2. **Configure database settings**:
   - Click the PostPen extension icon on LinkedIn
   - Click "Settings" in the footer
   - Fill in your MySQL database details
   - Click "Test Connection" to verify
   - Click "Save Settings" to store the configuration

## Database Schema

The extension creates a table called `linkedin_replies` with the following structure:

```sql
CREATE TABLE linkedin_replies (
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
);
```

## Usage

### Exporting Data
1. **Generate a reply** using the extension
2. **Click "Export to DB"** button in the reply actions
3. **Data is stored** in your MySQL database with complete context

### Data Stored
- **Generated Reply**: The AI-generated response
- **Selected Text**: The text you selected on LinkedIn
- **Original Post**: The main post content
- **Context Replies**: All other replies in the thread (as JSON)
- **Metadata**: URL, tone, length, timestamp, owner status

## API Endpoints

The server provides the following endpoints:

- `POST /api/test-db-connection` - Test database connectivity
- `POST /api/export-to-database` - Export reply data to database
- `GET /api/exports` - Retrieve all exported data
- `GET /health` - Server health check

## Security Notes

- Database credentials are stored locally in Chrome storage
- The server runs locally on your machine
- No data is sent to external servers
- Use strong passwords for your database

## Troubleshooting

### Connection Issues
- Verify MySQL server is running
- Check host, port, username, and password
- Ensure database exists and user has permissions
- Check firewall settings if using remote database

### Server Issues
- Ensure Node.js is installed
- Check if port 3000 is available
- Review server logs for error messages
- Verify all dependencies are installed

### Extension Issues
- Reload the extension after configuration changes
- Check browser console for error messages
- Ensure the server is running before testing connection

## Development

To run the server in development mode with auto-restart:
```bash
npm run dev
```

## License

MIT License - see LICENSE file for details. 