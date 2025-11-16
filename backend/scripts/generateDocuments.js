const { MongoClient } = require('mongodb');
require('dotenv').config();

// Sample document titles for each category
const documentTitles = {
  engineering: [
    'React Performance Optimization Guide',
    'Advanced JavaScript Patterns',
    'Node.js Best Practices',
    'Database Design Principles',
    'API Security Guidelines',
    'Microservices Architecture',
    'DevOps Automation',
    'Cloud Infrastructure Setup',
    'Container Orchestration',
    'System Monitoring Guide',
    'CI/CD Pipeline Setup',
    'Code Review Standards'
  ],
  hr: [
    'Employee Onboarding Process',
    'Performance Review Guidelines',
    'Workplace Diversity Policy',
    'Remote Work Best Practices',
    'Conflict Resolution Guide',
    'Team Building Activities',
    'Leadership Development',
    'Recruitment Strategy',
    'Employee Benefits Overview',
    'Training Program Manual',
    'Company Culture Handbook',
    'Compensation Structure'
  ],
  marketing: [
    'Digital Marketing Strategy',
    'Social Media Campaign Guide',
    'SEO Best Practices',
    'Content Marketing Plan',
    'Email Marketing Templates',
    'Brand Identity Guidelines',
    'Customer Analytics Report',
    'Market Research Summary',
    'Lead Generation Techniques',
    'Conversion Rate Optimization',
    'Influencer Partnership Guide',
    'Product Launch Strategy'
  ]
};

// Sample document snippets
const documentSnippets = {
  engineering: 'This comprehensive guide covers advanced techniques and best practices for optimizing performance in React applications. It includes detailed explanations of rendering optimization, state management, and component design patterns.',
  hr: 'This document outlines the standard procedures and guidelines for human resources operations. It covers employee relations, compliance requirements, and organizational policies to ensure a positive workplace environment.',
  marketing: 'This marketing strategy document provides insights into current market trends, target audience analysis, and recommended approaches for maximizing brand visibility and customer engagement across multiple channels.'
};

// File types
const fileTypes = ['txt', 'pdf', 'docx'];

// Categories
const categories = ['engineering', 'hr', 'marketing'];

async function generateAndInsertDocuments() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'knowledge_discovery';
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');
    
    // Generate documents
    const documents = [];
    const now = new Date();
    
    // Generate at least 12 documents per category
    for (const category of categories) {
      const titles = documentTitles[category];
      for (let i = 0; i < Math.max(12, titles.length); i++) {
        // Use available titles or generate generic ones
        const title = i < titles.length ? titles[i] : `${category.charAt(0).toUpperCase() + category.slice(1)} Document ${i + 1}`;
        
        // Randomly select file type
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        
        // Create document object
        const document = {
          id: Buffer.from(`generated-${category}-${i}-${now.getTime()}`).toString('base64'),
          title: title,
          type: fileType,
          fullPath: `C:\\projects\\RapidQuest\\backend\\documents\\${category}\\${title.replace(/\s+/g, '-').toLowerCase()}.${fileType}`,
          relativePath: `${category}\\${title.replace(/\s+/g, '-').toLowerCase()}.${fileType}`,
          category: category,
          lastModified: now.toISOString(),
          size: Math.floor(Math.random() * 1000000) + 1000, // Random size between 1KB and 1MB
          createdAt: now.toISOString(),
          snippet: documentSnippets[category],
          content: `${documentSnippets[category]} This is extended content for the document titled "${title}" in the ${category} category. It provides detailed information and insights relevant to this field.`
        };
        
        documents.push(document);
      }
    }
    
    // Insert documents
    const result = await documentsCollection.insertMany(documents);
    console.log(`Successfully inserted ${result.insertedCount} documents`);
    
    // Verify insertion by counting documents per category
    for (const category of categories) {
      const count = await documentsCollection.countDocuments({ category: category });
      console.log(`Documents in ${category} category: ${count}`);
    }
    
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error generating and inserting documents:', error);
  }
}

// Run the script
generateAndInsertDocuments();