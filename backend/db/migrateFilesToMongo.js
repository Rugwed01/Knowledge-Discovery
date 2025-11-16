const fs = require('fs').promises;
const path = require('path');
const { extractTextFromPDF } = require('../services/pdfParser');
const mime = require('mime-types');
const MongoService = require('./mongoService');

// Supported file types
const SUPPORTED_TYPES = {
  pdf: ['.pdf'],
  docx: ['.docx'],
  txt: ['.txt'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
};

// Get file type from extension
function getFileType(ext) {
  if (SUPPORTED_TYPES.pdf.includes(ext)) return 'pdf';
  if (SUPPORTED_TYPES.docx.includes(ext)) return 'docx';
  if (SUPPORTED_TYPES.txt.includes(ext)) return 'txt';
  if (SUPPORTED_TYPES.images.includes(ext)) return 'image';
  return 'unknown';
}

// Extract first 100 words from text
function extractSnippet(text) {
  if (!text) return '';
  const words = text.split(/\s+/);
  return words.slice(0, 100).join(' ');
}

// Process a single file
async function processFile(filePath, documentsFolder) {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileType = getFileType(ext);
    
    if (fileType === 'unknown') {
      return null; // Skip unsupported files
    }
    
    const relativePath = path.relative(documentsFolder || './documents', filePath);
    const fileName = path.basename(filePath);
    const folderCategory = path.dirname(relativePath).split(path.sep)[0] || 'root';
    
    const doc = {
      id: Buffer.from(filePath).toString('base64'),
      title: fileName,
      type: fileType,
      fullPath: filePath,
      relativePath: relativePath,
      category: folderCategory,
      lastModified: stats.mtime.toISOString(),
      size: stats.size,
      createdAt: new Date().toISOString()
    };
    
    // Extract content snippet for text-based files
    if (fileType === 'pdf') {
      try {
        const text = await extractTextFromPDF(filePath);
        doc.content = text;
        doc.snippet = extractSnippet(text);
      } catch (error) {
        console.error(`Error extracting text from PDF ${filePath}:`, error.message);
        doc.snippet = '';
      }
    } else if (fileType === 'txt') {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        doc.content = content;
        doc.snippet = extractSnippet(content);
      } catch (error) {
        console.error(`Error reading text file ${filePath}:`, error.message);
        doc.snippet = '';
      }
    } else if (fileType === 'docx') {
      // For simplicity, we're not implementing DOCX parsing in this demo
      // In a real implementation, you would use a library like mammoth.js
      doc.snippet = 'DOCX file - content extraction not implemented in this demo';
      doc.content = 'DOCX file - content extraction not implemented in this demo';
    }
    
    return doc;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return null;
  }
}

// Scan the documents folder recursively
async function scanDocumentsFolder(folderPath, documentsFolder) {
  let documents = [];
  
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      if (entry.isDirectory()) {
        const subDocuments = await scanDocumentsFolder(fullPath, documentsFolder);
        documents = documents.concat(subDocuments);
      } else if (entry.isFile()) {
        const doc = await processFile(fullPath, documentsFolder);
        if (doc) {
          documents.push(doc);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error.message);
  }
  
  return documents;
}

// Main migration function
async function migrateFilesToMongo() {
  const mongoService = new MongoService();
  
  try {
    // Connect to MongoDB
    const connected = await mongoService.connect();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      return;
    }
    
    // Get documents folder path
    const documentsFolder = path.resolve(process.env.DOCUMENTS_FOLDER || './documents');
    
    try {
      await fs.access(documentsFolder);
    } catch (error) {
      console.log(`Documents folder ${documentsFolder} does not exist.`);
      return;
    }
    
    console.log(`Scanning documents in ${documentsFolder}...`);
    const documents = await scanDocumentsFolder(documentsFolder, documentsFolder);
    console.log(`Found ${documents.length} documents to migrate`);
    
    if (documents.length > 0) {
      // Insert documents into MongoDB
      const result = await mongoService.insertDocuments(documents);
      console.log(`Successfully migrated ${result.insertedCount} documents to MongoDB`);
    } else {
      console.log('No documents found to migrate');
    }
    
    // Disconnect from MongoDB
    await mongoService.disconnect();
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateFilesToMongo();
}

module.exports = { migrateFilesToMongo };