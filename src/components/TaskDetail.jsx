import React, { useState } from 'react';
import useStore from '../store/useStore';
import DatePicker, { ReminderPicker } from './DatePicker';
import { LabelSelector } from './LabelManager';
import { isAfter, parseISO } from 'date-fns';

const TaskDetail = ({ task, onClose }) => {
  const { 
    updateTask, 
    projects,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    setTaskDueDate,
    toggleReminder,
    setRecurringPattern
  } = useStore();

  const [newSubtask, setNewSubtask] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!task) return null;

  const project = projects.find(p => p.id === task.projectId);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateTask({ ...task, [name]: value });
  };

  const handleDueDateChange = (dueDate) => {
    setTaskDueDate(task.id, dueDate);
  };

  const handleReminderChange = (minutes) => {
    toggleReminder(task.id, minutes);
  };

  const handleLabelsChange = (labelIds) => {
    updateTask({ ...task, labels: labelIds });
  };

  const isOverdue = task.dueDate && !task.completed && isAfter(new Date(), parseISO(task.dueDate));

  const handleGenerateSubtasks = async () => {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      setAiError('API ключ не налаштований.');
      return;
    }

    setIsGeneratingSubtasks(true);
    setAiError('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that breaks down a task into smaller, actionable subtasks. Respond with a valid JSON array of strings. For example: ["Subtask 1", "Subtask 2", "Subtask 3"].`
            },
            {
              role: "user",
              content: `Generate subtasks for the following task:\nTitle: ${task.title}\nDescription: ${task.description || ''}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const subtaskTitles = JSON.parse(data.choices[0].message.content);
      
      subtaskTitles.forEach(title => {
        addSubtask(task.id, title);
      });

    } catch (error) {
      console.error('AI Subtask Error:', error);
      setAiError(`Failed to generate subtasks: ${error.message}`);
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Task Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            name="title"
            value={task.title}
            onChange={handleInputChange}
            className="w-full bg-gray-700 p-2 rounded text-xl font-semibold"
          />
          <textarea
            name="description"
            value={task.description}
            onChange={handleInputChange}
            className="w-full bg-gray-700 p-2 rounded h-32"
            placeholder="Add a description..."
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project</label>
              <div className="bg-gray-700 p-2 rounded flex items-center gap-2">
                <span style={{ backgroundColor: project?.color }} className="w-3 h-3 rounded-full"></span>
                <span>{project?.name || 'No Project'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
              <select
                name="priority"
                value={task.priority}
                onChange={handleInputChange}
                className="w-full bg-gray-700 p-2 rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Deadline Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Дедлайн та нагадування</h3>
              {isOverdue && (
                <span className="px-2 py-1 bg-red-600/20 border border-red-500/50 text-red-300 text-xs rounded-full">
                  ⚠️ Прострочено
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Дата виконання</label>
                <DatePicker
                  value={task.dueDate}
                  onChange={handleDueDateChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Нагадування</label>
                <ReminderPicker
                  value={task.dueDateReminder}
                  onChange={handleReminderChange}
                />
              </div>
            </div>
          </div>

          {/* Labels Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Мітки</label>
            <LabelSelector
              selectedLabels={task.labels || []}
              onLabelsChange={handleLabelsChange}
            />
          </div>

          {/* Subtasks Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Subtasks</h3>
              <button 
                onClick={handleGenerateSubtasks}
                disabled={isGeneratingSubtasks}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2"
              >
                {isGeneratingSubtasks ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                ) : (
                  '✨ Generate with AI'
                )}
              </button>
            </div>
            <div class="space-y-2">
              {task.subtasks?.map(sub => (
                <SubtaskItem 
                  key={sub.id} 
                  subtask={sub} 
                  onUpdate={(updated) => updateSubtask(task.id, sub.id, updated)}
                  onDelete={() => deleteSubtask(task.id, sub.id)}
                />
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(newSubtask.trim()) { addSubtask(task.id, newSubtask); setNewSubtask(''); } }} class="flex gap-2 mt-2">
              <input 
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a new subtask..."
                className="flex-grow bg-gray-700 p-2 rounded"
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">Add</button>
            </form>
            {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const SubtaskItem = ({ subtask, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);

  const handleSave = () => {
    onUpdate({ title: editTitle });
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
      <div className="flex items-center gap-3 flex-grow">
        <input 
          type="checkbox" 
          checked={subtask.completed}
          onChange={() => onUpdate({ completed: !subtask.completed })}
          className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-600"
        />
        {isEditing ? (
          <input 
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="bg-gray-600 text-white p-1 rounded w-full"
            autoFocus
          />
        ) : (
          <span 
            onClick={() => setIsEditing(true)}
            className={`flex-grow ${subtask.completed ? 'line-through text-gray-400' : ''}`}>
            {subtask.title}
          </span>
        )}
      </div>
      <button onClick={onDelete} className="text-gray-400 hover:text-red-500 ml-2">🗑️</button>
    </div>
  );
};

export default TaskDetail;
