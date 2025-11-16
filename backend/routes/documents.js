const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { getAllDocuments, getDocumentById, searchDocuments, getFilterOptions } = require('../services/fileScanner');

const router = express.Router();

// GET /api/documents - Return list of documents with metadata
router.get('/', async (req, res) => {
  try {
    const { query, type, category } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (category) filters.category = category;
    
    const results = await searchDocuments(query, filters);
    res.json(results);
  } catch (error) {
    console.error('Error fetching documents:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/filter-options - Return filter options
router.get('/filter-options', async (req, res) => {
  try {
    const options = await getFilterOptions();
    res.json(options);
  } catch (error) {
    console.error('Error fetching filter options:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:id/preview - Return text snippet or image thumbnail
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // For text-based documents, return the snippet
    if (document.type === 'pdf' || document.type === 'txt' || document.type === 'docx') {
      return res.json({ snippet: document.snippet || document.content?.substring(0, 200) || '' });
    }
    
    // For images, return a thumbnail
    if (document.type === 'image') {
      try {
        // Create a thumbnail using sharp
        const thumbnailBuffer = await sharp(document.fullPath)
          .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        res.set('Content-Type', 'image/jpeg');
        res.send(thumbnailBuffer);
      } catch (error) {
        console.error('Error generating thumbnail:', error.message);
        // Fallback to serving the original image
        res.sendFile(document.fullPath);
      }
      return;
    }
    
    res.status(400).json({ error: 'Preview not available for this file type' });
  } catch (error) {
    console.error('Error generating preview:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:id/content - Return document content
router.get('/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // For text-based documents, return the content
    if (document.type === 'txt') {
      res.set('Content-Type', 'text/plain');
      return res.send(document.content || document.snippet || 'No content available');
    }
    
    if (document.type === 'pdf') {
      res.set('Content-Type', 'application/pdf');
      // In a real implementation, you would serve the actual PDF file
      // For now, we'll return a placeholder
      return res.send(`PDF content for ${document.title}\n\n${document.content || document.snippet || 'No content available'}`);
    }
    
    if (document.type === 'docx') {
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      // In a real implementation, you would serve the actual DOCX file
      // For now, we'll return a placeholder
      return res.send(`DOCX content for ${document.title}\n\n${document.content || document.snippet || 'No content available'}`);
    }
    
    // For images, serve the image file if it exists
    if (document.type === 'image') {
      try {
        // Check if file exists
        await fs.access(document.fullPath);
        return res.sendFile(document.fullPath);
      } catch (error) {
        // If file doesn't exist, return a placeholder
        res.set('Content-Type', 'text/plain');
        return res.send(`Image file for ${document.title}\n\nFile not found at: ${document.fullPath}`);
      }
    }
    
    res.status(400).json({ error: 'Content not available for this file type' });
  } catch (error) {
    console.error('Error serving document content:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;