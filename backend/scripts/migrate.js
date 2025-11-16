#!/usr/bin/env node

// Migration script to transfer files from filesystem to MongoDB
const { migrateFilesToMongo } = require('../db/migrateFilesToMongo');

async function runMigration() {
  console.log('Starting migration from filesystem to MongoDB...');
  await migrateFilesToMongo();
  console.log('Migration completed!');
  process.exit(0);
}

// Run migration
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}