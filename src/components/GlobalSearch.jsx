import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useStore from '../store/useStore';
import { searchTasks, getSearchSuggestions, SearchHistory } from '../utils/searchEngine';

const searchHistory = new SearchHistory();

export default function GlobalSearch({ isOpen, onClose, onSelectResult }) {
  const { tasks, projects, labels, setSelectedTaskId } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], projects: [], labels: [], total: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    projectId: 'all',
    labelIds: []
  });

  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Keyboard shortcuts
  useHotkeys('cmd+k, ctrl+k', (e) => {
    e.preventDefault();
    if (!isOpen) {
      // This would be handled by parent component
    }
  }, { enableOnFormTags: true });

  useHotkeys('escape', () => {
    if (isOpen) {
      onClose();
    }
  }, { enableOnFormTags: true, enabled: isOpen });

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setHistory(searchHistory.getHistory());
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ tasks: [], projects: [], labels: [], total: 0 });
      setSuggestions(getSearchSuggestions('', { tasks, projects, labels }));
      return;
    }

    setIsLoading(true);
    
    // Simulate async search with setTimeout to show loading state
    setTimeout(() => {
      const searchResults = searchTasks(searchQuery, tasks, projects, labels);
      setResults(searchResults);
      setSuggestions(getSearchSuggestions(searchQuery, { tasks, projects, labels }));
      setSelectedIndex(0);
      setIsLoading(false);
    }, 150);
  }, [tasks, projects, labels]);

  // Handle query changes with debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalResults = results.tasks.length + results.projects.length + results.labels.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(totalResults, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1));
        break;
      case 'Enter':
        e.preventDefault();
        handleSelectResult();
        break;
    }
  };

  const handleSelectResult = () => {
    const allResults = [
      ...results.tasks.map(t => ({ ...t, type: 'task' })),
      ...results.projects.map(p => ({ ...p, type: 'project' })),
      ...results.labels.map(l => ({ ...l, type: 'label' }))
    ];

    if (allResults[selectedIndex]) {
      const result = allResults[selectedIndex];
      
      if (result.type === 'task') {
        setSelectedTaskId(result.id);
      }
      
      searchHistory.addSearch(query);
      onSelectResult?.(result);
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    searchInputRef.current?.focus();
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem.query);
    searchInputRef.current?.focus();
  };

  const clearHistory = () => {
    searchHistory.clearHistory();
    setHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl mx-4 shadow-2xl">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Пошук завдань, проектів, міток... (Ctrl+K)"
                className="w-full bg-gray-700 text-white p-3 pl-10 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                showAdvanced ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Фільтри
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Статус</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full bg-gray-600 text-white p-2 rounded text-sm"
                  >
                    <option value="all">Всі</option>
                    <option value="active">Активні</option>
                    <option value="completed">Виконані</option>
                    <option value="overdue">Прострочені</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Пріоритет</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full bg-gray-600 text-white p-2 rounded text-sm"
                  >
                    <option value="all">Всі</option>
                    <option value="high">Високий</option>
                    <option value="medium">Середній</option>
                    <option value="low">Низький</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Проект</label>
                  <select
                    value={filters.projectId}
                    onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                    className="w-full bg-gray-600 text-white p-2 rounded text-sm"
                  >
                    <option value="all">Всі проекти</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Content */}
        <div className="max-h-96 overflow-y-auto">
          {query.length === 0 ? (
            <SearchEmpty 
              suggestions={suggestions}
              history={history}
              onSuggestionClick={handleSuggestionClick}
              onHistoryClick={handleHistoryClick}
              onClearHistory={clearHistory}
            />
          ) : (
            <SearchResults
              results={results}
              selectedIndex={selectedIndex}
              onSelectResult={handleSelectResult}
              query={query}
            />
          )}
        </div>

        {/* Search Footer */}
        <div className="p-3 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
          <div className="flex gap-4">
            <span>↑↓ навігація</span>
            <span>Enter вибрати</span>
            <span>Esc закрити</span>
          </div>
          <div>
            {results.total > 0 && `${results.total} результатів`}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchEmpty({ suggestions, history, onSuggestionClick, onHistoryClick, onClearHistory }) {
  return (
    <div className="p-4 space-y-4">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Популярні запити</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Останні пошуки</h3>
            <button
              onClick={onClearHistory}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Очистити
            </button>
          </div>
          <div className="space-y-1">
            {history.slice(0, 5).map((item, index) => (
              <button
                key={index}
                onClick={() => onHistoryClick(item)}
                className="w-full text-left p-2 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
              >
                🕒 {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && history.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p>Почніть вводити для пошуку завдань, проектів та міток</p>
        </div>
      )}
    </div>
  );
}

function SearchResults({ results, selectedIndex, onSelectResult, query }) {
  const allResults = [
    ...results.tasks.map(t => ({ ...t, type: 'task' })),
    ...results.projects.map(p => ({ ...p, type: 'project' })),
    ...results.labels.map(l => ({ ...l, type: 'label' }))
  ];

  if (allResults.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="text-4xl mb-2">🤷‍♂️</div>
        <p>Нічого не знайдено для "{query}"</p>
        <p className="text-sm mt-1">Спробуйте інші ключові слова</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Tasks */}
      {results.tasks.length > 0 && (
        <SearchSection
          title="Завдання"
          icon="📋"
          items={results.tasks}
          type="task"
          selectedIndex={selectedIndex}
          startIndex={0}
          onSelect={onSelectResult}
        />
      )}

      {/* Projects */}
      {results.projects.length > 0 && (
        <SearchSection
          title="Проекти"
          icon="📁"
          items={results.projects}
          type="project"
          selectedIndex={selectedIndex}
          startIndex={results.tasks.length}
          onSelect={onSelectResult}
        />
      )}

      {/* Labels */}
      {results.labels.length > 0 && (
        <SearchSection
          title="Мітки"
          icon="🏷️"
          items={results.labels}
          type="label"
          selectedIndex={selectedIndex}
          startIndex={results.tasks.length + results.projects.length}
          onSelect={onSelectResult}
        />
      )}
    </div>
  );
}

function SearchSection({ title, icon, items, type, selectedIndex, startIndex, onSelect }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2 px-2">
        {icon} {title} ({items.length})
      </h3>
      <div className="space-y-1">
        {items.map((item, index) => {
          const globalIndex = startIndex + index;
          const isSelected = selectedIndex === globalIndex;
          
          return (
            <SearchResultItem
              key={item.id}
              item={item}
              type={type}
              isSelected={isSelected}
              onClick={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

function SearchResultItem({ item, type, isSelected, onClick }) {
  const getItemIcon = () => {
    switch (type) {
      case 'task': return item.completed ? '✅' : '📋';
      case 'project': return '📁';
      case 'label': return '🏷️';
      default: return '📄';
    }
  };

  const getItemSubtext = () => {
    switch (type) {
      case 'task': 
        return item.description || 'Без опису';
      case 'project': 
        return item.description || 'Без опису';
      case 'label': 
        return `Мітка • ${item.color}`;
      default: 
        return '';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        isSelected ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{getItemIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">
            {item.name || item.title}
          </div>
          <div className="text-sm text-gray-400 truncate">
            {getItemSubtext()}
          </div>
          {item.searchScore && (
            <div className="text-xs text-gray-500 mt-1">
              Релевантність: {Math.round((1 - item.searchScore) * 100)}%
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
