import { SearchDocument, SearchResult } from '../types';

// Define the structure of documents from our backend API
interface BackendDocument {
  id: string;
  title: string;
  type: string;
  fullPath: string;
  relativePath: string;
  category: string;
  lastModified: string;
  size: number;
  snippet?: string;
  content?: string;
}

class BackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  async search(
    query: string,
    filters?: {
      category?: string[];
      topic?: string[]; // We'll map folderCategory to topic for compatibility
      fileType?: string[]; // We'll map type to fileType for compatibility
    },
    limit = 20,
    offset = 0
  ): Promise<SearchResult> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      
      // Map filters to backend API parameters
      if (filters?.category && filters.category.length > 0) {
        // Use the first category as the filter
        params.append('category', filters.category[0]);
      }
      
      if (filters?.fileType && filters.fileType.length > 0) {
        // Use the first fileType as the filter
        params.append('type', filters.fileType[0]);
      }

      const response = await fetch(`${this.baseUrl}/api/documents?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }

      const data: BackendDocument[] = await response.json();

      // Transform backend documents to SearchDocument format
      const hits: SearchDocument[] = data.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content || doc.snippet || '',
        snippet: doc.snippet,
        category: doc.category,
        topic: doc.category, // Map category to topic for compatibility
        fileType: doc.type, // Map type to fileType
        url: `${this.baseUrl}/api/documents/${doc.id}/content`, // Updated to use the content endpoint
        createdAt: doc.lastModified,
      }));

      return {
        hits,
        query,
        processingTimeMs: 0, // Not provided by our backend
        limit,
        offset,
        estimatedTotalHits: hits.length,
      };
    } catch (error) {
      console.error('Backend search error:', error);
      throw error;
    }
  }

  async getFilterOptions(): Promise<{ categories: string[]; topics: string[]; fileTypes: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/filter-options`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Return the filter options directly from the backend
      return {
        categories: data.categories || [],
        topics: data.topics || data.categories || [], // Fallback to categories if topics not available
        fileTypes: data.fileTypes || []
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Return empty arrays as fallback
      return { categories: [], topics: [], fileTypes: [] };
    }
  }

  async getAutocomplete(query: string): Promise<string[]> {
    if (!query) return [];

    try {
      const response = await this.search(query, undefined, 5);
      return response.hits.map((hit) => hit.title);
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }
}

export default BackendService;