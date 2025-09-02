import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist } from 'zustand/middleware';
import { isAfter, isToday, isThisWeek, parseISO } from 'date-fns';
import {
  loadTasks, saveTasks,
  loadProjects, saveProjects,
  loadSections, saveSections,
  loadLabels, saveLabels
} from '../utils/storage';

const useStore = create(persist(
  (set, get) => ({
    // STATE
    tasks: loadTasks(),
    projects: loadProjects(),
    sections: loadSections(),
    labels: loadLabels(),
    selectedProjectId: null,
    selectedTaskId: null,
    viewMode: 'list', // 'list' or 'board'
    
    // ACTIONS

    // UI Actions
    setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
    setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
    setViewMode: (mode) => set({ viewMode: mode }),

    // Task Actions
    addTask: (task) => set(state => ({ 
      tasks: [...state.tasks, { 
        ...task, 
        id: uuidv4(), 
        createdAt: new Date().toISOString(), 
        completed: false, 
        subtasks: [],
        dueDate: task.dueDate || null,
        dueDateReminder: task.dueDateReminder || null,
        recurringPattern: task.recurringPattern || null
      }] 
    })),
    updateTask: (updatedTask) => set(state => ({
      tasks: state.tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
    })),
    deleteTask: (taskId) => set(state => ({ tasks: state.tasks.filter(task => task.id !== taskId) })),
    reorderTasks: (activeId, overId) => set(state => {
      const tasks = [...state.tasks];
      const activeIndex = tasks.findIndex(t => t.id === activeId);
      const overIndex = tasks.findIndex(t => t.id === overId);
      if (activeIndex === -1 || overIndex === -1) return { tasks };

      const [movedTask] = tasks.splice(activeIndex, 1);
      tasks.splice(overIndex, 0, movedTask);

      return { tasks };
    }),

    // Subtask Actions
    addSubtask: (taskId, subtaskTitle) => set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              subtasks: [...(task.subtasks || []), { id: uuidv4(), title: subtaskTitle, completed: false }] 
            }
          : task
      )
    })),
    updateSubtask: (taskId, subtaskId, updatedSubtask) => set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              subtasks: task.subtasks.map(sub => sub.id === subtaskId ? { ...sub, ...updatedSubtask } : sub)
            }
          : task
      )
    })),
    deleteSubtask: (taskId, subtaskId) => set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.filter(sub => sub.id !== subtaskId) }
          : task
      )
    })),
    toggleTaskCompletion: (taskId) => set(state => ({
        tasks: state.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed, progress: !task.completed ? 100 : 0 } : task
        )
    })),

    // Deadline Actions
    setTaskDueDate: (taskId, dueDate) => set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, dueDate } : task
      )
    })),
    toggleReminder: (taskId, minutes) => set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, dueDateReminder: minutes } : task
      )
    })),
    setRecurringPattern: (taskId, pattern) => set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, recurringPattern: pattern } : task
      )
    })),
    getOverdueTasks: () => {
      const { tasks } = get();
      const now = new Date();
      return tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        isAfter(now, parseISO(task.dueDate))
      );
    },
    getTasksDueToday: () => {
      const { tasks } = get();
      return tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        isToday(parseISO(task.dueDate))
      );
    },
    getTasksDueThisWeek: () => {
      const { tasks } = get();
      return tasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        isThisWeek(parseISO(task.dueDate))
      );
    },

    // Project Actions
    addProject: (project) => {
        const newProject = { ...project, id: uuidv4(), createdAt: new Date().toISOString(), sections: [] };
        set(state => ({ projects: [...state.projects, newProject] }));
        return newProject;
    },
    updateProject: (updatedProject) => set(state => ({
      projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    })),
    deleteProject: (projectId) => set(state => {
        // Also delete associated sections and tasks
        const sectionsToDelete = state.sections.filter(s => s.projectId === projectId).map(s => s.id);
        return {
            projects: state.projects.filter(p => p.id !== projectId),
            sections: state.sections.filter(s => s.projectId !== projectId),
            tasks: state.tasks.filter(t => t.projectId !== projectId),
        }
    }),

    // Section Actions
    addSection: (section) => {
        const newSection = { ...section, id: uuidv4() };
        set(state => ({ sections: [...state.sections, newSection] }));
        return newSection;
    },
    updateSection: (updatedSection) => set(state => ({
        sections: state.sections.map(s => s.id === updatedSection.id ? updatedSection : s)
    })),
    deleteSection: (sectionId) => set(state => ({
        sections: state.sections.filter(s => s.id !== sectionId),
        // Optionally, reassign tasks to null sectionId or a default section
        tasks: state.tasks.map(t => t.sectionId === sectionId ? { ...t, sectionId: null } : t)
    })),

    // Label Actions
    addLabel: (label) => {
        const newLabel = { ...label, id: uuidv4(), createdAt: new Date().toISOString() };
        set(state => ({ labels: [...state.labels, newLabel] }));
        return newLabel;
    },
    updateLabel: (updatedLabel) => set(state => ({
        labels: state.labels.map(l => l.id === updatedLabel.id ? updatedLabel : l)
    })),
    deleteLabel: (labelId) => set(state => ({
        labels: state.labels.filter(l => l.id !== labelId),
        // Remove the label from all tasks
        tasks: state.tasks.map(t => ({ 
          ...t, 
          labels: (t.labels || []).filter(l => l !== labelId) 
        }))
    })),
    addLabelToTask: (taskId, labelId) => set(state => ({
        tasks: state.tasks.map(task =>
            task.id === taskId
                ? { ...task, labels: [...(task.labels || []), labelId] }
                : task
        )
    })),
    removeLabelFromTask: (taskId, labelId) => set(state => ({
        tasks: state.tasks.map(task =>
            task.id === taskId
                ? { ...task, labels: (task.labels || []).filter(l => l !== labelId) }
                : task
        )
    })),
    getTasksByLabel: (labelId) => {
        const { tasks } = get();
        return tasks.filter(task => (task.labels || []).includes(labelId));
    }
  }),
  {
    name: 'ai-task-manager-storage', // unique name
    // Replace default storage with our custom ones to handle migrations etc.
    getStorage: () => ({
      getItem: (name) => {
        const state = {
          tasks: loadTasks(),
          projects: loadProjects(),
          sections: loadSections(),
          labels: loadLabels(),
        };
        return JSON.stringify({ state });
      },
      setItem: (name, value) => {
        const { state } = JSON.parse(value);
        saveTasks(state.tasks);
        saveProjects(state.projects);
        saveSections(state.sections);
        saveLabels(state.labels);
      },
      removeItem: (name) => {
        // This could clear all storage if needed
      },
    }),
  }
));

export default useStore;
