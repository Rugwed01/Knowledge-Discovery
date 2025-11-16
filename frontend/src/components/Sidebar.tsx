import { BookmarkIcon, TrendingUp, Home, FileText, X } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';

const Sidebar = () => {
  const { savedSearches, performSearch, setFilters, clearFilters, removeSavedSearch, filterOptions } = useSearch();

  const handleSavedSearchClick = (query: string) => {
    performSearch(query);
  };

  const handleRemoveSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedSearch(id);
  };

  const handleNavigationClick = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'all':
        clearFilters();
        performSearch('');
        break;
      case 'recent':
        // For now, we'll just clear and show all (can be enhanced later)
        clearFilters();
        performSearch('');
        break;
      case 'favorites':
        // For now, we'll just clear and show all (can be enhanced later)
        clearFilters();
        performSearch('');
        break;
      case 'category':
        if (value) {
          setFilters({ categories: [value] });
          performSearch(''); // Perform search with the new filter
        }
        break;
      default:
        clearFilters();
        performSearch('');
    }
  };

  // Create popular topics with actual counts
  const popularTopics = filterOptions.categories.map(category => ({
    name: category,
    count: (filterOptions as any).categoryCounts?.[category] || 1
  }));

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <nav className="p-4 space-y-6">
        <div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300">
            <Home className="w-5 h-5" />
            <span className="font-medium">Navigation</span>
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <button 
                onClick={() => handleNavigationClick('all')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                All Documents
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigationClick('recent')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Recent
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigationClick('favorites')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Favorites
              </button>
            </li>
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300">
            <BookmarkIcon className="w-5 h-5" />
            <span className="font-medium">Saved Searches</span>
          </div>
          <ul className="mt-2 space-y-1">
            {savedSearches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-500 italic">
                No saved searches
              </li>
            ) : (
              savedSearches.map((search) => (
                <li key={search.id} className="flex items-center group">
                  <button
                    onClick={() => handleSavedSearchClick(search.query)}
                    className="flex-1 text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors truncate"
                    title={search.query}
                  >
                    {search.query}
                  </button>
                  <button
                    onClick={(e) => handleRemoveSavedSearch(search.id, e)}
                    className="hidden group-hover:block px-2 py-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove saved search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Popular Topics</span>
          </div>
          <ul className="mt-2 space-y-1">
            {popularTopics.length > 0 ? (
              popularTopics.map((topic) => (
                <li key={topic.name}>
                  <button
                    onClick={() => handleNavigationClick('category', topic.name)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{topic.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {topic.count}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-500 italic">
                No topics available
              </li>
            )}
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Resources</span>
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <button 
                onClick={() => alert('Help Center - Coming Soon')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Help Center
              </button>
            </li>
            <li>
              <button 
                onClick={() => alert('Documentation - Coming Soon')}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Documentation
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;