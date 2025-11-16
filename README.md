# Knowledge Discovery & Internal Search

A full-stack search application built with React, TypeScript, and Node.js that enables organizations to index, search, and discover internal documents across multiple categories.

## Features

- **Powerful Search**: Full-text search across all indexed documents
- **Category Filtering**: Organize documents by categories (Engineering, HR, Marketing)
- **File Type Support**: Handles TXT, PDF, DOCX, and image files
- **Responsive UI**: Modern interface with light/dark mode support
- **MongoDB Integration**: Persistent storage with MongoDB Atlas
- **Real-time Indexing**: Automatic document scanning and indexing

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS for styling
- Context API for state management
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB for document storage
- RESTful API architecture
- CORS-enabled for cross-origin requests

## Architecture

```
├── frontend/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── contexts/      # React context providers
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript interfaces
│   └── vite.config.ts     # Vite configuration
│
└── backend/            # Node.js + Express backend
    ├── routes/            # API route definitions
    ├── services/          # Business logic
    ├── db/                # Database services
    ├── documents/         # Document storage directory
    └── app.js             # Express application entry
```

## Prerequisites

- Node.js 16+
- MongoDB Atlas account (for production)
- npm or yarn package manager

## Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   DOCUMENTS_FOLDER=./documents
   RESCAN_INTERVAL=5
   PORT=3001
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DATABASE=knowledge_discovery
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   VITE_DEMO_MODE=false
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `backend`
4. Add environment variables in the Render dashboard:
   - `MONGODB_URI`
   - `MONGODB_DATABASE`
   - `DOCUMENTS_FOLDER`
   - `RESCAN_INTERVAL`
   - `PORT`

### Frontend (Vercel)
1. Create a new Project on Vercel
2. Connect your GitHub repository
3. Set the framework preset to "Vite"
4. Add environment variables:
   - `VITE_BACKEND_URL` (your Render backend URL)

## API Endpoints

### Documents
- `GET /api/documents` - Retrieve all documents
- `GET /api/documents/filter-options` - Get filter options and counts
- `GET /api/documents/:id/preview` - Get document preview
- `GET /api/documents/:id/content` - Get document content

## Environment Variables

### Backend
| Variable | Description | Default |
|---------|-------------|---------|
| `DOCUMENTS_FOLDER` | Path to documents directory | `./documents` |
| `RESCAN_INTERVAL` | Minutes between scans | `5` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | - |
| `MONGODB_DATABASE` | MongoDB database name | `knowledge_discovery` |

### Frontend
| Variable | Description | Default |
|---------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:3001` |
| `VITE_DEMO_MODE` | Enable demo mode | `false` |

## Document Structure

Documents are organized in the following folder structure:
```
documents/
├── engineering/
├── hr/
└── marketing/
```

Each category folder contains relevant documents. The system automatically scans and indexes documents on startup and at regular intervals.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.