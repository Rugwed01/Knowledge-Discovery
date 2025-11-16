import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { SearchDocument, SearchResult, SavedSearch } from '../types';
import BackendService from '../services/backendService';

interface SearchFilters {
  categories: string[];
  topics: string[];
  fileTypes: string[];
}

interface FilterOptions {
  categories: string[];
  topics: string[];
  fileTypes: string[];
  categoryCounts?: Record<string, number>;
}

interface SearchContextType {
  searchResults: SearchDocument[];
  isLoading: boolean;
  isFiltersLoading: boolean;
  error: string | null;
  query: string;
  filters: SearchFilters;
  filterOptions: FilterOptions;
  searchHistory: string[];
  savedSearches: SavedSearch[];
  totalResults: number;
  performSearch: (query: string) => Promise<void>;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  saveSearch: () => void;
  removeSavedSearch: (id: string) => void;
  refreshFilterOptions: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchService] = useState(() => new BackendService());
  const [searchResults, setSearchResults] = useState<SearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFiltersState] = useState<SearchFilters>({
    categories: [],
    topics: [],
    fileTypes: [],
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    topics: [],
    fileTypes: [],
    categoryCounts: {},
  });
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem('searchHistory');
    return stored ? JSON.parse(stored) : [];
  });
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    const stored = localStorage.getItem('savedSearches');
    return stored ? JSON.parse(stored) : [];
  });

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFiltersLoading(true);
      try {
        const options = await searchService.getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch filter options');
      } finally {
        setIsFiltersLoading(false);
      }
    };

    fetchFilterOptions();
  }, [searchService]);

  const refreshFilterOptions = useCallback(async () => {
    setIsFiltersLoading(true);
    try {
      const options = await searchService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options');
    } finally {
      setIsFiltersLoading(false);
    }
  }, [searchService]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      setIsLoading(true);
      setError(null);

      try {
        const result: SearchResult = await searchService.search(
          searchQuery,
          {
            category: filters.categories.length > 0 ? filters.categories : undefined,
            topic: filters.topics.length > 0 ? filters.topics : undefined,
            fileType: filters.fileTypes.length > 0 ? filters.fileTypes : undefined,
          }
        );

        setSearchResults(result.hits);
        setTotalResults(result.estimatedTotalHits);

        if (searchQuery && !searchHistory.includes(searchQuery)) {
          const newHistory = [searchQuery, ...searchHistory.slice(0, 4)];
          setSearchHistory(newHistory);
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, searchHistory, searchService]
  );

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState((prev: SearchFilters) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      categories: [],
      topics: [],
      fileTypes: [],
    });
  }, []);

  const saveSearch = useCallback(() => {
    if (!query) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      query,
      timestamp: new Date().toISOString(),
      resultsCount: totalResults,
    };

    const newSavedSearches = [newSearch, ...savedSearches.slice(0, 9)];
    setSavedSearches(newSavedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(newSavedSearches));
  }, [query, totalResults, savedSearches]);

  const removeSavedSearch = useCallback((id: string) => {
    const newSavedSearches = savedSearches.filter(search => search.id !== id);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(newSavedSearches));
  }, [savedSearches]);

  return (
    <SearchContext.Provider
      value={{
        searchResults,
        isLoading,
        isFiltersLoading,
        error,
        query,
        filters,
        filterOptions,
        searchHistory,
        savedSearches,
        totalResults,
        performSearch,
        setFilters,
        clearFilters,
        saveSearch,
        removeSavedSearch,
        refreshFilterOptions,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};