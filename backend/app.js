require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const documentsRouter = require('./routes/documents');
const { initializeIndex } = require('./services/fileScanner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the documents folder
app.use('/documents', express.static(path.resolve(process.env.DOCUMENTS_FOLDER || './documents')));

// Routes
app.use('/api/documents', documentsRouter);

// Root route to confirm server is running
app.get('/', (req, res) => {
  res.json({ 
    message: 'Knowledge Discovery Backend is running', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Initialize the document index on startup
initializeIndex();

// Start the server
app.listen(PORT, () => {
  console.log(`Knowledge Discovery backend listening on port ${PORT}`);
});

module.exports = app;