import React, { useState } from 'react';
import useStore from '../store/useStore';

const ProjectSidebar = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    addProject
  } = useStore();

  const [newProjectName, setNewProjectName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);

  const handleAddProject = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject({
        name: newProjectName,
        description: '',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        settings: { defaultView: 'list', allowSubtasks: true }
      });
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col">
      <h2 className="text-xl font-bold text-white mb-4">Projects</h2>
      <nav className="flex-1">
        <ul>
          {projects.map(project => (
            <li key={project.id} className="mb-2">
              <button
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${selectedProjectId === project.id ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                <span style={{ backgroundColor: project.color }} className="w-3 h-3 rounded-full"></span>
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        {showAddProject ? (
          <form onSubmit={handleAddProject} className="space-y-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name..."
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
            />
            <div className="flex gap-2">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Add</button>
                <button type="button" onClick={() => setShowAddProject(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setShowAddProject(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + New Project
          </button>
        )}
      </div>
    </aside>
  );
};

export default ProjectSidebar;
