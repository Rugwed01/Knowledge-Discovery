import { useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Filters from './components/Filters';
import SearchResults from './components/SearchResults';
import { useSearch } from './contexts/SearchContext';

function App() {
  const { searchHistory, performSearch, saveSearch, query } = useSearch();

  useEffect(() => {
    performSearch('');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />

      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="mb-6">
              <SearchBar />
            </div>

            {searchHistory.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => performSearch(item)}
                      className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <Filters />

              {query && (
                <button
                  onClick={saveSearch}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save search</span>
                </button>
              )}
            </div>

            <SearchResults />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
