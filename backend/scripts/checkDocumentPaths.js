const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDocumentPaths() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'knowledge_discovery';
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');
    
    // Get a few documents to check their paths
    const sampleDocuments = await documentsCollection.find().limit(10).toArray();
    
    console.log('Sample document paths:');
    sampleDocuments.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.category})`);
      console.log(`   Path: ${doc.relativePath}`);
      console.log(`   Full Path: ${doc.fullPath}`);
      console.log(`   Type: ${doc.type}`);
      console.log('---');
    });
    
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking document paths:', error);
  }
}

// Run the script
checkDocumentPaths();