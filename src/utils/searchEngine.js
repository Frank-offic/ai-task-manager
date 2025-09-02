import Fuse from 'fuse.js';

// Search configuration for different content types
const searchConfigs = {
  tasks: {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'comments', weight: 0.2 },
      { name: 'projectName', weight: 0.1 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  },
  projects: {
    keys: [
      { name: 'name', weight: 0.6 },
      { name: 'description', weight: 0.4 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true
  },
  labels: {
    keys: ['name'],
    threshold: 0.2,
    includeScore: true,
    includeMatches: true
  }
};

// Enhanced search function with fuzzy matching
export function searchTasks(query, tasks, projects, labels) {
  if (!query || query.trim().length < 2) {
    return {
      tasks: [],
      projects: [],
      labels: [],
      total: 0
    };
  }

  const normalizedQuery = query.trim().toLowerCase();
  
  // Prepare tasks with additional searchable fields
  const searchableTasks = tasks.map(task => {
    const project = projects.find(p => p.id === task.projectId);
    const taskLabels = labels.filter(label => (task.labels || []).includes(label.id));
    
    return {
      ...task,
      projectName: project?.name || '',
      labelNames: taskLabels.map(l => l.name).join(' '),
      comments: (task.comments || []).map(c => c.text).join(' ')
    };
  });

  // Create Fuse instances
  const taskFuse = new Fuse(searchableTasks, searchConfigs.tasks);
  const projectFuse = new Fuse(projects, searchConfigs.projects);
  const labelFuse = new Fuse(labels, searchConfigs.labels);

  // Perform searches
  const taskResults = taskFuse.search(normalizedQuery);
  const projectResults = projectFuse.search(normalizedQuery);
  const labelResults = labelFuse.search(normalizedQuery);

  return {
    tasks: taskResults.map(result => ({
      ...result.item,
      searchScore: result.score,
      matches: result.matches
    })),
    projects: projectResults.map(result => ({
      ...result.item,
      searchScore: result.score,
      matches: result.matches
    })),
    labels: labelResults.map(result => ({
      ...result.item,
      searchScore: result.score,
      matches: result.matches
    })),
    total: taskResults.length + projectResults.length + labelResults.length
  };
}

// Highlight matching text in search results
export function highlightMatches(text, query) {
  if (!text || !query) return text;
  
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedText = text.toLowerCase();
  
  if (!normalizedText.includes(normalizedQuery)) return text;
  
  const regex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-300 text-black px-1 rounded">$1</mark>');
}

// Generate search suggestions based on context
export function getSearchSuggestions(query, context) {
  const { tasks, projects, labels } = context;
  const suggestions = new Set();
  
  if (!query || query.length < 1) {
    // Popular suggestions when no query
    suggestions.add('high priority');
    suggestions.add('overdue');
    suggestions.add('today');
    suggestions.add('completed');
    
    // Add popular project names
    projects.slice(0, 3).forEach(project => {
      suggestions.add(project.name.toLowerCase());
    });
    
    return Array.from(suggestions).slice(0, 5);
  }
  
  const normalizedQuery = query.toLowerCase();
  
  // Task title suggestions
  tasks.forEach(task => {
    const words = task.title.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 2 && word.startsWith(normalizedQuery)) {
        suggestions.add(word);
      }
    });
  });
  
  // Project name suggestions
  projects.forEach(project => {
    if (project.name.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(project.name.toLowerCase());
    }
  });
  
  // Label name suggestions
  labels.forEach(label => {
    if (label.name.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(label.name.toLowerCase());
    }
  });
  
  // Status suggestions
  const statusSuggestions = ['completed', 'active', 'overdue', 'high priority', 'medium priority', 'low priority'];
  statusSuggestions.forEach(status => {
    if (status.includes(normalizedQuery)) {
      suggestions.add(status);
    }
  });
  
  return Array.from(suggestions).slice(0, 8);
}

// Advanced search with filters
export function advancedSearch(query, filters, tasks, projects, labels) {
  let results = tasks;
  
  // Apply text search first
  if (query && query.trim().length >= 2) {
    const searchResults = searchTasks(query, tasks, projects, labels);
    results = searchResults.tasks;
  }
  
  // Apply filters
  if (filters.status && filters.status !== 'all') {
    results = results.filter(task => {
      switch (filters.status) {
        case 'completed': return task.completed;
        case 'active': return !task.completed;
        case 'overdue': return task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
        default: return true;
      }
    });
  }
  
  if (filters.priority && filters.priority !== 'all') {
    results = results.filter(task => task.priority === filters.priority);
  }
  
  if (filters.projectId && filters.projectId !== 'all') {
    results = results.filter(task => task.projectId === filters.projectId);
  }
  
  if (filters.labelIds && filters.labelIds.length > 0) {
    results = results.filter(task => 
      filters.labelIds.some(labelId => (task.labels || []).includes(labelId))
    );
  }
  
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    results = results.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= start && dueDate <= end;
    });
  }
  
  return results;
}

// Search history management
export class SearchHistory {
  constructor(maxItems = 10) {
    this.maxItems = maxItems;
    this.storageKey = 'ai-task-manager-search-history';
  }
  
  getHistory() {
    try {
      const history = localStorage.getItem(this.storageKey);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }
  
  addSearch(query) {
    if (!query || query.trim().length < 2) return;
    
    const history = this.getHistory();
    const normalizedQuery = query.trim().toLowerCase();
    
    // Remove existing instance
    const filtered = history.filter(item => item.query !== normalizedQuery);
    
    // Add to beginning
    const updated = [
      { query: normalizedQuery, timestamp: Date.now() },
      ...filtered
    ].slice(0, this.maxItems);
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }
  
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage errors
    }
  }
}

// Utility function to escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
