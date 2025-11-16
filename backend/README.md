# Knowledge Discovery Backend

A Node.js/Express backend for a "Knowledge Discovery & Internal Search" hackathon project.

## Features

- Scans a local `/documents` folder for files (PDF, DOCX, TXT, image formats)
- Extracts and indexes metadata for each file:
  - ID
  - Title (filename)
  - Type
  - Full relative path
  - Folder/project/team category (from filesystem)
  - Last modified date
- For PDFs/TXT/DOCX: extracts first 100 words as a content snippet
- For images: provides filename, type, and thumbnail preview endpoint
- Auto-categorizes files by folder
- REST API endpoints for searching and filtering documents
- Indexes all files on server start
- Re-scans folder every N minutes (configurable)
- CORS enabled for frontend access
- Uses dotenv for configuration
- MongoDB integration for persistent storage

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   DOCUMENTS_FOLDER=./documents
   RESCAN_INTERVAL=5
   PORT=3001
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DATABASE=knowledge_discovery
   ```

3. Place your documents in the `documents` folder (organized by subfolders for categorization)

4. (Optional) Migrate existing files to MongoDB:
   ```
   npm run migrate
   ```

5. Start the server:
   ```
   npm start
   ```

## API Endpoints

### GET /api/documents

Returns list of documents with all metadata.

**Query Parameters:**
- `query` - Search term to filter documents
- `type` - Filter by document type (pdf, txt, docx, image)
- `category` - Filter by folder category

**Example:**
```
GET /api/documents?query=react&type=txt&category=engineering
```

### GET /api/documents/filter-options

Returns available filter options (categories, topics, file types).

### GET /api/documents/:id/preview

Returns text snippet (for documents) or image thumbnail.

**Example:**
```
GET /api/documents/encodedFilePath/preview
```

## File Organization

- `app.js` - Main application file
- `services/fileScanner.js` - Scans documents and extracts metadata
- `services/pdfParser.js` - Extracts text from PDF files
- `routes/documents.js` - API routes for documents
- `db/mongoService.js` - MongoDB database service
- `db/migrateFilesToMongo.js` - Migration script for existing files
- `documents/` - Folder containing all documents to be indexed