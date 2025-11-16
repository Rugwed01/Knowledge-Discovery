export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  snippet?: string;
  category: string;
  topic: string;
  fileType: string;
  url?: string;
  createdAt: string;
  author?: string;
}

export interface SearchFilters {
  categories: string[];
  topics: string[];
  fileTypes: string[];
}

export interface SearchResult {
  hits: SearchDocument[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

export interface SavedSearch {
  id: string;
  query: string;
  timestamp: string;
  resultsCount: number;
}