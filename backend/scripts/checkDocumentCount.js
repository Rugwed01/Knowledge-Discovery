const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDocumentCount() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'knowledge_discovery';
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const documentsCollection = db.collection('documents');
    
    // Get total document count
    const totalDocuments = await documentsCollection.countDocuments();
    console.log(`Total documents in database: ${totalDocuments}`);
    
    // Get document count by category
    const categories = ['engineering', 'hr', 'marketing'];
    for (const category of categories) {
      const count = await documentsCollection.countDocuments({ category: category });
      console.log(`Documents in ${category} category: ${count}`);
    }
    
    // Show a sample of documents
    console.log('\nSample documents:');
    const sampleDocuments = await documentsCollection.find().limit(5).toArray();
    sampleDocuments.forEach(doc => {
      console.log(`- ${doc.title} (${doc.category})`);
    });
    
    await client.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error checking document count:', error);
  }
}

// Run the script
checkDocumentCount();