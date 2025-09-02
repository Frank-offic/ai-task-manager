import React from 'react';
import useStore from '../store/useStore';
import { highlightMatches } from '../utils/searchEngine';

export default function SearchResults({ results, query, onClose }) {
  const { setSelectedTaskId, setSelectedProjectId } = useStore();

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    onClose();
  };

  const handleProjectClick = (project) => {
    setSelectedProjectId(project.id);
    onClose();
  };

  const allResults = [
    ...results.tasks.map(t => ({ ...t, type: 'task' })),
    ...results.projects.map(p => ({ ...p, type: 'project' })),
    ...results.labels.map(l => ({ ...l, type: 'label' }))
  ];

  if (allResults.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        <div className="text-4xl mb-2">🔍</div>
        <p>Нічого не знайдено для "{query}"</p>
        <p className="text-sm mt-1">Спробуйте змінити пошуковий запит</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Результати пошуку для "{query}"
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Tasks Results */}
      {results.tasks.length > 0 && (
        <ResultSection
          title="Завдання"
          icon="📋"
          items={results.tasks}
          onItemClick={handleTaskClick}
          query={query}
          renderItem={(task) => (
            <TaskResultItem key={task.id} task={task} query={query} onClick={() => handleTaskClick(task)} />
          )}
        />
      )}

      {/* Projects Results */}
      {results.projects.length > 0 && (
        <ResultSection
          title="Проекти"
          icon="📁"
          items={results.projects}
          onItemClick={handleProjectClick}
          query={query}
          renderItem={(project) => (
            <ProjectResultItem key={project.id} project={project} query={query} onClick={() => handleProjectClick(project)} />
          )}
        />
      )}

      {/* Labels Results */}
      {results.labels.length > 0 && (
        <ResultSection
          title="Мітки"
          icon="🏷️"
          items={results.labels}
          query={query}
          renderItem={(label) => (
            <LabelResultItem key={label.id} label={label} query={query} />
          )}
        />
      )}
    </div>
  );
}

function ResultSection({ title, icon, items, renderItem }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        <span>{icon}</span>
        <span>{title} ({items.length})</span>
      </h3>
      <div className="space-y-2">
        {items.map(renderItem)}
      </div>
    </div>
  );
}

function TaskResultItem({ task, query, onClick }) {
  const { projects, labels } = useStore();
  const project = projects.find(p => p.id === task.projectId);
  const taskLabels = labels.filter(label => (task.labels || []).includes(label.id));

  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{task.completed ? '✅' : '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 
              className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}
              dangerouslySetInnerHTML={{ __html: highlightMatches(task.title, query) }}
            />
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          
          {task.description && (
            <p 
              className="text-sm text-gray-400 mb-2"
              dangerouslySetInnerHTML={{ __html: highlightMatches(task.description, query) }}
            />
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {project && (
              <div className="flex items-center gap-1">
                <span style={{ backgroundColor: project.color }} className="w-2 h-2 rounded-full"></span>
                <span>{project.name}</span>
              </div>
            )}
            {task.dueDate && (
              <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
            {taskLabels.length > 0 && (
              <div className="flex gap-1">
                {taskLabels.slice(0, 3).map(label => (
                  <span
                    key={label.id}
                    className="px-1 py-0.5 rounded text-xs text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
                {taskLabels.length > 3 && (
                  <span className="text-gray-400">+{taskLabels.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Показати в контексті →
        </div>
      </div>
    </button>
  );
}

function ProjectResultItem({ project, query, onClick }) {
  const { tasks } = useStore();
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.completed).length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">📁</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 
              className="font-medium text-white"
              dangerouslySetInnerHTML={{ __html: highlightMatches(project.name, query) }}
            />
            <span 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          </div>
          
          {project.description && (
            <p 
              className="text-sm text-gray-400 mb-2"
              dangerouslySetInnerHTML={{ __html: highlightMatches(project.description, query) }}
            />
          )}
          
          <div className="text-xs text-gray-500">
            {projectTasks.length} завдань • {completedTasks} виконано
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Перейти до проекту →
        </div>
      </div>
    </button>
  );
}

function LabelResultItem({ label, query }) {
  const { tasks } = useStore();
  const labelTasks = tasks.filter(task => (task.labels || []).includes(label.id));

  return (
    <div className="p-3 bg-gray-700 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-lg">🏷️</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 
              className="font-medium text-white"
              dangerouslySetInnerHTML={{ __html: highlightMatches(label.name, query) }}
            />
            <span 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          </div>
          
          <div className="text-xs text-gray-500">
            {labelTasks.length} завдань з цією міткою
          </div>
        </div>
      </div>
    </div>
  );
}
