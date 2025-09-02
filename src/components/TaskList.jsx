import React, { useState } from 'react';
import useStore from '../store/useStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isAfter, isToday, isTomorrow, parseISO } from 'date-fns';

export default function TaskList({ tasks, onUpdateTask, onDeleteTask }) {
  const reorderTasks = useStore(state => state.reorderTasks);
  const labels = useStore(state => state.labels);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created'); // 'created', 'dueDate', 'priority'
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(null);

  const filteredTasks = tasks.filter(task => {
    // Apply status filter
    let passesStatusFilter = true;
    if (filter === 'active') passesStatusFilter = !task.completed;
    else if (filter === 'completed') passesStatusFilter = task.completed;
    else if (filter === 'overdue') passesStatusFilter = task.dueDate && !task.completed && isAfter(new Date(), parseISO(task.dueDate));
    else if (filter === 'today') passesStatusFilter = task.dueDate && isToday(parseISO(task.dueDate));
    else if (filter === 'upcoming') passesStatusFilter = task.dueDate && !task.completed && !isAfter(new Date(), parseISO(task.dueDate));

    // Apply label filter
    let passesLabelFilter = true;
    if (selectedLabelFilter) {
      passesLabelFilter = (task.labels || []).includes(selectedLabelFilter);
    }

    return passesStatusFilter && passesLabelFilter;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // default: newest first
  });

  const completedCount = tasks.filter(t => t.completed).length;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id, over.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Мої завдання</h2>
          <div className="text-sm text-gray-300">
            {completedCount}/{tasks.length} виконано
          </div>
        </div>

        <div className="space-y-3">
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Всі', icon: '📋' },
              { key: 'active', label: 'Активні', icon: '⚡' },
              { key: 'completed', label: 'Виконані', icon: '✅' },
              { key: 'overdue', label: 'Прострочені', icon: '⚠️' },
              { key: 'today', label: 'Сьогодні', icon: '📅' },
              { key: 'upcoming', label: 'Майбутні', icon: '🔮' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Сортувати:</span>
            <div className="flex gap-2">
              {[
                { key: 'created', label: 'За датою створення' },
                { key: 'dueDate', label: 'За дедлайном' },
                { key: 'priority', label: 'За пріоритетом' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    sortBy === key 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Label filters */}
          {labels.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Мітки:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLabelFilter(null)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    !selectedLabelFilter 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Всі мітки
                </button>
                {labels.map(label => (
                  <button
                    key={label.id}
                    onClick={() => setSelectedLabelFilter(label.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      selectedLabelFilter === label.id
                        ? 'text-white'
                        : 'text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{ 
                      backgroundColor: selectedLabelFilter === label.id ? label.color : 'transparent',
                      border: `1px solid ${label.color}`
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📝</div>
                <p>Немає завдань для відображення</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <SortableTaskItem 
                  key={task.id} 
                  id={task.id}
                  task={task}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableTaskItem({ id, task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-start gap-2">
      <div {...listeners} className="pt-5 px-2 cursor-move text-gray-400 hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      </div>
      <div className="flex-grow">
        <TaskItem task={task} />
      </div>
    </div>
  );
}

function TaskItem({ task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  
  const projects = useStore(state => state.projects);
  const setSelectedTaskId = useStore(state => state.setSelectedTaskId);
  const updateTask = useStore(state => state.updateTask);
  const deleteTask = useStore(state => state.deleteTask);
  const labels = useStore(state => state.labels);
  const project = projects.find(p => p.id === task.projectId);
  const taskLabels = labels.filter(label => (task.labels || []).includes(label.id));

  const priorityColors = {
    high: 'border-red-500 bg-red-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10', 
    low: 'border-green-500 bg-green-500/10'
  };

  const priorityTextColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  };

  const isOverdue = task.dueDate && !task.completed && isAfter(new Date(), parseISO(task.dueDate));
  
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isToday(date)) return { text: 'Сьогодні', color: 'bg-blue-600/20 text-blue-300 border-blue-500/50' };
    if (isTomorrow(date)) return { text: 'Завтра', color: 'bg-green-600/20 text-green-300 border-green-500/50' };
    if (isOverdue) return { text: format(date, 'dd MMM'), color: 'bg-red-600/20 text-red-300 border-red-500/50' };
    return { text: format(date, 'dd MMM'), color: 'bg-gray-600/20 text-gray-300 border-gray-500/50' };
  };

  const dueDateInfo = formatDueDate(task.dueDate);

  const handleSave = () => {
    updateTask(task.id, { title: editTitle });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`p-4 rounded-lg border-2 ${priorityColors[task.priority]}`}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-gray-800 text-white p-2 rounded mb-2 border border-gray-600"
          placeholder="Назва таску..."
        />
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            ✅ Зберегти
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            ❌ Скасувати
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-4 rounded-lg border-2 ${priorityColors[task.priority]} ${task.completed ? 'opacity-60' : ''} transition-colors duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                updateTask({ ...task, completed: !task.completed });
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs cursor-pointer select-none ${
                task.completed 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'border-gray-400 hover:border-green-400'
              }`}
            >
              {task.completed ? '✓' : ''}
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                {task.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 pl-12 mb-2">
            <span className={`text-xs px-2 py-1 rounded ${priorityTextColors[task.priority]} border border-current`}>
              {task.priority.toUpperCase()}
            </span>
            {dueDateInfo && (
              <span className={`text-xs px-2 py-1 rounded border ${dueDateInfo.color}`}>
                📅 {dueDateInfo.text}
                {isOverdue && ' ⚠️'}
              </span>
            )}
          </div>
          
          {task.description && (
            <p className={`text-sm mb-2 ml-8 ${task.completed ? 'text-gray-500' : 'text-gray-300'}`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 ml-8 text-xs text-gray-400">
            {project && (
              <div className="flex items-center gap-2">
                <span style={{ backgroundColor: project.color }} className="w-2 h-2 rounded-full"></span>
                <span>{project.name}</span>
              </div>
            )}
            <span>📅 {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Task Labels */}
          {taskLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-8 mt-2">
              {taskLabels.map(label => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-gray-400 hover:text-blue-400 text-sm"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTaskId(task.id);
            }}
            className="text-gray-400 hover:text-blue-400 text-sm"
          >
            👁️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the detail view
              deleteTask(task.id);
            }}
            className="text-gray-400 hover:text-red-400 text-sm"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}