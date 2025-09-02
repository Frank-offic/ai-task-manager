import { v4 as uuidv4 } from 'uuid';

const TASKS_KEY = 'aiTaskManagerTasks_v2';
const PROJECTS_KEY = 'aiTaskManagerProjects';
const SECTIONS_KEY = 'aiTaskManagerSections';
const LABELS_KEY = 'aiTaskManagerLabels';
const MIGRATION_KEY = 'aiTaskManagerMigration_v2_completed';

// Generic helper functions
const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data to ${key}:`, error);
  }
};

const loadData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading data from ${key}:`, error);
    return defaultValue;
  }
};

// Specific data functions
export const saveTasks = (tasks) => saveData(TASKS_KEY, tasks);
export const loadTasks = () => {
    // Run migration if it hasn't been done
    if (!localStorage.getItem(MIGRATION_KEY)) {
        migrateTasksToV2();
    }
    return loadData(TASKS_KEY);
};

export const saveProjects = (projects) => saveData(PROJECTS_KEY, projects);
export const loadProjects = () => loadData(PROJECTS_KEY);

export const saveSections = (sections) => saveData(SECTIONS_KEY, sections);
export const loadSections = () => loadData(SECTIONS_KEY);

export const saveLabels = (labels) => saveData(LABELS_KEY, labels);
export const loadLabels = () => loadData(LABELS_KEY);

// Migration from old structure
export const migrateTasksToV2 = () => {
  try {
    const oldTasks = JSON.parse(localStorage.getItem('aiTaskManagerTasks')) || [];
    if (oldTasks.length === 0) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        console.log('No old tasks to migrate.');
        return;
    }

    let projects = loadProjects();
    let defaultProject;

    if (projects.length === 0) {
        defaultProject = {
            id: uuidv4(),
            name: 'Inbox',
            description: 'Default project for migrated tasks',
            color: '#808080',
            sections: [],
            createdAt: new Date().toISOString(),
            settings: {
                defaultView: 'list',
                allowSubtasks: true
            }
        };
        projects.push(defaultProject);
        saveProjects(projects);
    } else {
        defaultProject = projects.find(p => p.name === 'Inbox') || projects[0];
    }

    const migratedTasks = oldTasks.map(task => ({
      ...task,
      projectId: defaultProject.id,
      sectionId: null,
      parentTaskId: null,
      dueDate: null,
      labels: [],
      assignee: null,
      estimatedMinutes: null,
      actualMinutes: null,
      progress: task.completed ? 100 : 0,
      order: 0,
      comments: [],
      attachments: []
    }));

    saveTasks(migratedTasks);
    localStorage.setItem(MIGRATION_KEY, 'true');
    // Optional: remove old tasks key after successful migration
    // localStorage.removeItem('aiTaskManagerTasks');
    console.log(`Successfully migrated ${migratedTasks.length} tasks.`);

  } catch (error) {
    console.error('Error migrating tasks:', error);
  }
};

// Backup functionality
export const backupData = () => {
    try {
        const allData = {
            tasks: loadTasks(),
            projects: loadProjects(),
            sections: loadSections(),
            labels: loadLabels(),
            backupDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('Backup created successfully.');
    } catch (error) {
        console.error('Error creating backup:', error);
    }
};