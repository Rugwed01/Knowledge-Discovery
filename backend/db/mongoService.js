const { MongoClient } = require('mongodb');
require('dotenv').config();

class MongoService {
  constructor() {
    this.client = null;
    this.db = null;
    this.documentsCollection = null;
  }

  async connect() {
    try {
      // Get MongoDB connection string from environment variables
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DATABASE || 'knowledge_discovery';
      
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.documentsCollection = this.db.collection('documents');
      
      console.log('Connected to MongoDB');
      
      // Create indexes for better search performance
      await this.documentsCollection.createIndex({ title: "text", content: "text", category: "text" });
      await this.documentsCollection.createIndex({ type: 1 });
      await this.documentsCollection.createIndex({ category: 1 });
      await this.documentsCollection.createIndex({ lastModified: -1 });
      
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  async insertDocument(document) {
    try {
      const result = await this.documentsCollection.insertOne(document);
      return result;
    } catch (error) {
      console.error('Error inserting document:', error);
      throw error;
    }
  }

  async insertDocuments(documents) {
    try {
      const result = await this.documentsCollection.insertMany(documents);
      return result;
    } catch (error) {
      console.error('Error inserting documents:', error);
      throw error;
    }
  }

  async searchDocuments(query = '', filters = {}) {
    try {
      const searchQuery = {};
      
      // Text search
      if (query) {
        searchQuery.$text = { $search: query };
      }
      
      // Apply filters
      if (filters.type) {
        searchQuery.type = filters.type;
      }
      
      if (filters.category) {
        searchQuery.category = filters.category;
      }
      
      const results = await this.documentsCollection.find(searchQuery).toArray();
      
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
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  async getAllDocuments() {
    try {
      const results = await this.documentsCollection.find({}).toArray();
      
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
    } catch (error) {
      console.error('Error fetching all documents:', error);
      throw error;
    }
  }

  async getDocumentById(id) {
    try {
      const document = await this.documentsCollection.findOne({ id: id });
      return document;
    } catch (error) {
      console.error('Error fetching document by ID:', error);
      throw error;
    }
  }

  async getFilterOptions() {
    try {
      // Get all documents to calculate counts
      const documents = await this.getAllDocuments();
      
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
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  async updateDocument(id, updateData) {
    try {
      const result = await this.documentsCollection.updateOne(
        { id: id },
        { $set: updateData }
      );
      return result;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      const result = await this.documentsCollection.deleteOne({ id: id });
      return result;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

module.exports = MongoService;