const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

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
async function processFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileType = getFileType(ext);
    
    if (fileType === 'unknown') {
      return null; // Skip unsupported files
    }
    
    const relativePath = path.relative(process.env.DOCUMENTS_FOLDER || './documents', filePath);
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
    if (fileType === 'txt') {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        doc.content = content;
        doc.snippet = extractSnippet(content);
      } catch (error) {
        console.error(`Error reading text file ${filePath}:`, error.message);
        doc.snippet = '';
      }
    } else if (fileType === 'pdf' || fileType === 'docx') {
      // For simplicity, we're not implementing PDF/DOCX parsing in this demo
      // In a real implementation, you would use libraries like pdf-parse or mammoth.js
      doc.snippet = `${fileType.toUpperCase()} file - content extraction not implemented in this demo`;
      doc.content = `${fileType.toUpperCase()} file - content extraction not implemented in this demo`;
    }
    
    return doc;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return null;
  }
}

// Scan the documents folder recursively
async function scanDocumentsFolder(folderPath) {
  const documents = [];
  
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      if (entry.isDirectory()) {
        const subDocs = await scanDocumentsFolder(fullPath);
        documents.push(...subDocs);
      } else if (entry.isFile()) {
        const doc = await processFile(fullPath);
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

async function migrateDocuments() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'knowledge_discovery';
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');
    
    // Get documents folder path
    const documentsFolder = path.resolve(process.env.DOCUMENTS_FOLDER || './documents');
    console.log(`Scanning documents in ${documentsFolder}...`);
    
    // Check if documents folder exists
    try {
      await fs.access(documentsFolder);
    } catch (error) {
      console.log(`Documents folder ${documentsFolder} does not exist.`);
      await client.close();
      return;
    }
    
    // Scan documents
    const documents = await scanDocumentsFolder(documentsFolder);
    console.log(`Found ${documents.length} documents in file system`);
    
    // Migrate documents to database
    let migratedCount = 0;
    for (const doc of documents) {
      try {
        // Check if document already exists
        const existingDoc = await documentsCollection.findOne({ id: doc.id });
        
        if (existingDoc) {
          // Update existing document
          await documentsCollection.updateOne(
            { id: doc.id },
            { $set: doc }
          );
          console.log(`Updated document: ${doc.title}`);
        } else {
          // Insert new document
          await documentsCollection.insertOne(doc);
          console.log(`Inserted document: ${doc.title}`);
        }
        migratedCount++;
      } catch (error) {
        console.error(`Error saving document ${doc.title}:`, error.message);
      }
    }
    
    console.log(`Migrated ${migratedCount} documents to database`);
    
    // Get final document count
    const totalDocuments = await documentsCollection.countDocuments();
    console.log(`Total documents in database: ${totalDocuments}`);
    
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error migrating documents:', error);
  }
}

// Run the migration
migrateDocuments();