import { FileText, File, Presentation, Table, Video, ExternalLink } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { SearchDocument } from '../types';

const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return FileText;
    case 'document':
      return File;
    case 'presentation':
      return Presentation;
    case 'spreadsheet':
      return Table;
    case 'video':
      return Video;
    default:
      return File;
  }
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Engineering: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Marketing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    HR: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Support: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const SearchResultItem = ({ document }: { document: SearchDocument }) => {
  const Icon = getFileIcon(document.fileType);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
              {document.title}
            </h3>
            {document.url && (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {document.snippet || document.content}
          </p>

          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500">
            <span className={`px-2 py-1 rounded-full ${getCategoryColor(document.category)}`}>
              {document.category}
            </span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              {document.topic}
            </span>
            <span>{document.fileType}</span>
            <span>•</span>
            <span>{new Date(document.createdAt).toLocaleDateString()}</span>
            {document.author && (
              <>
                <span>•</span>
                <span>{document.author}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchResults = () => {
  const { searchResults, isLoading, error, query, totalResults } = useSearch();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 animate-pulse"
          >
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Start Searching
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a search query to discover documents and resources
        </p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No results found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Found <span className="font-semibold text-gray-900 dark:text-white">{totalResults}</span>{' '}
          results for "{query}"
        </p>
      </div>

      {searchResults.map((doc) => (
        <SearchResultItem key={doc.id} document={doc} />
      ))}
    </div>
  );
};

export default SearchResults;
