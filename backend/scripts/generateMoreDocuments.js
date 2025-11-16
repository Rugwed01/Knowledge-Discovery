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
    'Code Review Standards',
    'Frontend Framework Comparison',
    'Backend Scalability Strategies',
    'Mobile App Development Guide',
    'Testing Strategies for Web Apps',
    'Git Workflow Best Practices',
    'API Documentation Standards',
    'Software Architecture Patterns',
    'Debugging Techniques'
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
    'Compensation Structure',
    'Workplace Safety Guidelines',
    'Employee Engagement Strategies',
    'Career Development Framework',
    'Performance Management System',
    'Flexible Work Arrangements',
    'Health and Wellness Programs',
    'Communication Policies',
    'Exit Interview Process'
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
    'Product Launch Strategy',
    'Customer Retention Tactics',
    'Marketing Automation Setup',
    'PPC Campaign Management',
    'Brand Reputation Management',
    'Customer Journey Mapping',
    'Marketing Metrics Dashboard',
    'Competitor Analysis Framework',
    'Marketing Budget Allocation'
  ]
};

// Sample document snippets
const documentSnippets = {
  engineering: 'This comprehensive guide covers advanced techniques and best practices for optimizing performance in software development. It includes detailed explanations of design patterns, coding standards, and implementation strategies.',
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
    
    // Generate at least 20 documents per category for a good distribution
    for (const category of categories) {
      const titles = documentTitles[category];
      for (let i = 0; i < Math.max(20, titles.length); i++) {
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
          content: `${documentSnippets[category]} This is extended content for the document titled "${title}" in the ${category} category. It provides detailed information and insights relevant to this field. Additional details include best practices, implementation guidelines, and strategic recommendations.`
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
    
    // Get total document count
    const totalDocuments = await documentsCollection.countDocuments();
    console.log(`Total documents in database: ${totalDocuments}`);
    
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error generating and inserting documents:', error);
  }
}

// Run the script
generateAndInsertDocuments();