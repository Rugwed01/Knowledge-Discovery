const fs = require('fs').promises;
const path = require('path');
const { extractTextFromPDF } = require('./pdfParser');
const mime = require('mime-types');
const MongoService = require('../db/mongoService');

// Supported file types
const SUPPORTED_TYPES = {
  pdf: ['.pdf'],
  docx: ['.docx'],
  txt: ['.txt'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
};

// MongoDB service instance
let mongoService = null;
let scanIntervalId = null;
let isMongoConnected = false;

// Initialize MongoDB connection
async function initializeMongoService() {
  // If MongoDB is already connected, return the existing instance
  if (isMongoConnected && mongoService) {
    return mongoService;
  }
  
  // If no MongoDB URI is provided, skip MongoDB initialization
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not provided, skipping MongoDB initialization');
    return null;
  }
  
  try {
    if (!mongoService) {
      mongoService = new MongoService();
    }
    const connected = await mongoService.connect();
    if (connected) {
      isMongoConnected = true;
      console.log('Successfully connected to MongoDB');
    } else {
      console.log('Failed to connect to MongoDB, falling back to file system scanning');
      isMongoConnected = false;
    }
    return mongoService;
  } catch (error) {
    console.error('Error initializing MongoDB connection:', error.message);
    isMongoConnected = false;
    return null;
  }
}

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
async function scanDocumentsFolder(folderPath) {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      if (entry.isDirectory()) {
        await scanDocumentsFolder(fullPath);
      } else if (entry.isFile()) {
        const doc = await processFile(fullPath);
        if (doc) {
          // Update or insert document in MongoDB if connected
          if (isMongoConnected && mongoService) {
            try {
              const existingDoc = await mongoService.getDocumentById(doc.id);
              if (existingDoc) {
                // Update existing document
                await mongoService.updateDocument(doc.id, doc);
              } else {
                // Insert new document
                await mongoService.insertDocument(doc);
              }
            } catch (error) {
              console.error(`Error saving document to MongoDB:`, error.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error.message);
  }
}

// Scan documents for display (fallback when MongoDB is not available)
async function scanDocumentsFolderForDisplay(folderPath = null) {
  const documents = [];
  const documentsFolder = folderPath || path.resolve(process.env.DOCUMENTS_FOLDER || './documents');
  
  try {
    const entries = await fs.readdir(documentsFolder, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(documentsFolder, entry.name);
      
      if (entry.isDirectory()) {
        const subDocs = await scanDocumentsFolderForDisplay(fullPath);
        documents.push(...subDocs);
      } else if (entry.isFile()) {
        const doc = await processFile(fullPath);
        if (doc) {
          documents.push(doc);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning folder ${documentsFolder}:`, error.message);
  }
  
  // Deduplicate documents by ID to prevent duplicates
  const seenIds = new Set();
  const uniqueDocuments = [];
  
  for (const doc of documents) {
    if (!seenIds.has(doc.id)) {
      seenIds.add(doc.id);
      uniqueDocuments.push(doc);
    }
  }
  
  return uniqueDocuments;
}

// Find document by ID from file system (fallback)
async function findDocumentByIdFromFileSystem(id) {
  const documents = await scanDocumentsFolderForDisplay();
  return documents.find(doc => doc.id === id) || null;
}

// Initialize the document index
async function initializeIndex() {
  try {
    // Initialize MongoDB connection
    await initializeMongoService();
    
    const documentsFolder = path.resolve(process.env.DOCUMENTS_FOLDER || './documents');
    
    try {
      await fs.access(documentsFolder);
    } catch (error) {
      console.log(`Documents folder ${documentsFolder} does not exist. Creating it.`);
      await fs.mkdir(documentsFolder, { recursive: true });
    }
    
    console.log(`Scanning documents in ${documentsFolder}...`);
    await scanDocumentsFolder(documentsFolder);
    
    // Get total document count
    let docCount = 0;
    if (isMongoConnected && mongoService) {
      const allDocs = await mongoService.getAllDocuments();
      docCount = allDocs.length;
    }
    console.log(`Indexed ${docCount} documents`);
    
    // Set up periodic rescan
    const intervalMinutes = parseInt(process.env.RESCAN_INTERVAL) || 5;
    if (scanIntervalId) {
      clearInterval(scanIntervalId);
    }
    
    scanIntervalId = setInterval(async () => {
      console.log('Rescanning documents folder...');
      await scanDocumentsFolder(documentsFolder);
      
      // Get updated document count
      let docCount = 0;
      if (isMongoConnected && mongoService) {
        const allDocs = await mongoService.getAllDocuments();
        docCount = allDocs.length;
      }
      console.log(`Index updated. Total documents: ${docCount}`);
    }, intervalMinutes * 60 * 1000);
  } catch (error) {
    console.error('Error initializing document index:', error.message);
  }
}

// Get all documents
async function getAllDocuments() {
  try {
    await initializeMongoService();
    if (isMongoConnected && mongoService) {
      return await mongoService.getAllDocuments();
    } else {
      // Fallback to file system scanning if MongoDB is not available
      return await scanDocumentsFolderForDisplay();
    }
  } catch (error) {
    console.error('Error fetching all documents:', error.message);
    return [];
  }
}

// Get document by ID
async function getDocumentById(id) {
  try {
    await initializeMongoService();
    if (isMongoConnected && mongoService) {
      return await mongoService.getDocumentById(id);
    } else {
      // Fallback to file system scanning if MongoDB is not available
      return await findDocumentByIdFromFileSystem(id);
    }
  } catch (error) {
    console.error('Error fetching document by ID:', error.message);
    return null;
  }
}

// Search documents
async function searchDocuments(query = '', filters = {}) {
  try {
    await initializeMongoService();
    if (isMongoConnected && mongoService) {
      return await mongoService.searchDocuments(query, filters);
    } else {
      // Fallback to file system search if MongoDB is not available
      return await searchDocumentsFromFileSystem(query, filters);
    }
  } catch (error) {
    console.error('Error searching documents:', error.message);
    return [];
  }
}

// Search documents from file system (fallback)
async function searchDocumentsFromFileSystem(query = '', filters = {}) {
  const documents = await scanDocumentsFolderForDisplay();
  
  // Apply text search
  let results = documents;
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = documents.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      (doc.snippet && doc.snippet.toLowerCase().includes(lowerQuery)) ||
      doc.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Apply filters
  if (filters.type) {
    results = results.filter(doc => doc.type === filters.type);
  }
  
  if (filters.category) {
    results = results.filter(doc => doc.category === filters.category);
  }
  
  // Deduplicate results by ID to prevent duplicates
  const seenIds = new Set();
  const uniqueResults = [];
  
  for (const doc of results) {
    if (!seenIds.has(doc.id)) {
      seenIds.add(doc.id);
      uniqueResults.push(doc);
    }
  }
  
  return uniqueResults;
}

// Get filter options with document counts
async function getFilterOptions() {
  try {
    await initializeMongoService();
    let documents = [];
    
    if (isMongoConnected && mongoService) {
      documents = await mongoService.getAllDocuments();
    } else {
      // Fallback to file system scanning if MongoDB is not available
      documents = await scanDocumentsFolderForDisplay();
    }
    
    // Extract unique values
    const categories = Array.from(new Set(documents.map(doc => doc.category)));
    const fileTypes = Array.from(new Set(documents.map(doc => doc.type)));
    
    // Calculate document counts for each category
    const categoryCounts = {};
    documents.forEach(doc => {
      categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
    });
    
    // For topics, we'll use categories as topics for compatibility
    return {
      categories,
      topics: categories,
      fileTypes,
      categoryCounts
    };
  } catch (error) {
    console.error('Error fetching filter options:', error.message);
    return { categories: [], topics: [], fileTypes: [], categoryCounts: {} };
  }
}

// Get filter options from file system (fallback)
async function getFilterOptionsFromFileSystem() {
  const documents = await scanDocumentsFolderForDisplay();
  
  // Extract unique values
  const categories = Array.from(new Set(documents.map(doc => doc.category)));
  const fileTypes = Array.from(new Set(documents.map(doc => doc.type)));
  
  // Calculate document counts for each category
  const categoryCounts = {};
  documents.forEach(doc => {
    categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
  });
  
  // For topics, we'll use categories as topics for compatibility
  return {
    categories,
    topics: categories,
    fileTypes,
    categoryCounts
  };
}

module.exports = {
  initializeIndex,
  getAllDocuments,
  getDocumentById,
  searchDocuments,
  getFilterOptions
};