import React, { useState, useEffect, Suspense, lazy } from 'react';
import TaskList from './components/TaskList';
import AIAssistant from './components/AIAssistant';
import ProjectSidebar from './components/ProjectSidebar';
import TaskDetail from './components/TaskDetail';
import NotificationSystem from './components/NotificationSystem';

// Lazy load heavy components
const KanbanBoard = lazy(() => import('./components/KanbanBoard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const LabelManager = lazy(() => import('./components/LabelManager'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
import useStore from './store/useStore';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import LoadingSpinner from './components/LoadingSpinner';
import OfflineIndicator from './components/OfflineIndicator';
import { KanbanSkeleton, CalendarSkeleton } from './components/SkeletonLoaders';
import { useToast } from './components/Toast';

function App() {
  const {
    tasks,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedTaskId,
    setSelectedTaskId,
    viewMode,
    setViewMode,
    addTask,
    updateTask,
    deleteTask,
    addProject
  } = useStore();

  const { success, error, warning, info, ToastContainer } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    projectId: ''
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenSearch: () => setShowSearch(true),
    onOpenQuickAdd: () => setShowAddForm(true),
    onEscape: () => {
      setShowAddForm(false);
      setShowSearch(false);
      setShowLabelManager(false);
      setShowAnalytics(false);
      setSelectedTaskId(null);
    }
  });

  // Ensure a default project exists and is selected
  useEffect(() => {
    if (projects.length === 0) {
      const newProject = addProject({ 
        name: 'Inbox', 
        description: 'Default project for tasks',
        color: '#808080',
        settings: { defaultView: 'list', allowSubtasks: true }
      });
      setSelectedProjectId(newProject.id);
    } else if (!selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, addProject, setSelectedProjectId]);

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const taskToAdd = {
        ...newTask,
        projectId: selectedProjectId,
      };
      addTask(taskToAdd);
      success('Завдання створено', `"${newTask.title}" додано до проекту`);
      setNewTask({ title: '', description: '', priority: 'medium', projectId: '' });
      setShowAddForm(false);
    }
  };

  const addAITasks = (aiTasks) => {
    aiTasks.forEach(task => {
      addTask({
        ...task,
        projectId: selectedProjectId,
      });
    });
    success('AI завдання створені', `Додано ${aiTasks.length} завдань від AI асистента`);
  };

  const filteredTasks = tasks.filter(task => task.projectId === selectedProjectId);
  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <ProjectSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🚀 AI Task Manager</h1>
            <p className="text-gray-400">Керуйте завданнями з допомогою ШІ</p>
          </div>

          {/* AI Assistant */}
          <div className="mb-8">
            <AIAssistant onTasksGenerated={addAITasks} />
          </div>

          {/* Add Task Form */}
          <div className="mb-6">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                ➕ Додати завдання
              </button>
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Назва завдання..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"
                />
                <textarea
                  placeholder="Опис завдання..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 h-20"
                />
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="bg-gray-700 text-white p-2 rounded border border-gray-600"
                >
                  <option value="low">Низький пріоритет</option>
                  <option value="medium">Середній пріоритет</option>
                  <option value="high">Високий пріоритет</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTask}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    ✅ Зберегти
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    ❌ Скасувати
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View Mode and Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            {/* View Mode Buttons */}
            <div className="flex gap-2">
              {[
                { key: 'list', label: 'Список', icon: '📋' },
                { key: 'board', label: 'Дошка', icon: '📊' },
                { key: 'calendar', label: 'Календар', icon: '📅' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    viewMode === key 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg"
                title="Пошук (Ctrl+K)"
              >
                🔍 <span className="hidden sm:inline">Пошук</span>
              </button>
              <button
                onClick={() => setShowLabelManager(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg"
              >
                🏷️ <span className="hidden sm:inline">Мітки</span>
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg"
              >
                📊 <span className="hidden sm:inline">Аналітика</span>
              </button>
            </div>
          </div>

          {/* Task Views */}
          {viewMode === 'list' && (
            <TaskList
              tasks={filteredTasks}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          )}
          {viewMode === 'board' && (
            <Suspense fallback={<KanbanSkeleton />}>
              <KanbanBoard tasks={filteredTasks} />
            </Suspense>
          )}
          {viewMode === 'calendar' && (
            <Suspense fallback={<CalendarSkeleton />}>
              <CalendarView />
            </Suspense>
          )}
        </div>
      </main>

      {/* Modals and Overlays */}
      {selectedTask && (
        <TaskDetail 
          task={selectedTask} 
          onClose={() => setSelectedTaskId(null)} 
        />
      )}

      {showSearch && (
        <Suspense fallback={<LoadingSpinner message="Завантаження пошуку..." />}>
          <GlobalSearch
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            onSelectResult={() => setShowSearch(false)}
          />
        </Suspense>
      )}

      {showLabelManager && (
        <Suspense fallback={<LoadingSpinner message="Завантаження міток..." />}>
          <LabelManager
            isOpen={showLabelManager}
            onClose={() => setShowLabelManager(false)}
          />
        </Suspense>
      )}

      {showAnalytics && (
        <Suspense fallback={<LoadingSpinner message="Завантаження аналітики..." />}>
          <AnalyticsDashboard
            isOpen={showAnalytics}
            onClose={() => setShowAnalytics(false)}
          />
        </Suspense>
      )}

      <NotificationSystem tasks={tasks} />
      <OfflineIndicator />
      <ToastContainer />
    </div>
  );
}

export default App;