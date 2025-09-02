import React, { useState } from 'react';
import useStore from '../store/useStore';

export default function LabelManager({ isOpen, onClose }) {
  const { labels, addLabel, updateLabel, deleteLabel, getTasksByLabel } = useStore();
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3B82F6' });
  const [editingLabel, setEditingLabel] = useState(null);

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#6B7280'  // Gray
  ];

  const handleAddLabel = (e) => {
    e.preventDefault();
    if (!newLabel.name.trim()) return;

    addLabel({
      name: newLabel.name.trim(),
      color: newLabel.color
    });

    setNewLabel({ name: '', color: '#3B82F6' });
  };

  const handleUpdateLabel = (label, updates) => {
    updateLabel({ ...label, ...updates });
    setEditingLabel(null);
  };

  const handleDeleteLabel = (labelId) => {
    if (window.confirm('Видалити цю мітку? Вона буде видалена з усіх завдань.')) {
      deleteLabel(labelId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl text-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Управління мітками</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Add new label form */}
        <form onSubmit={handleAddLabel} className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Створити нову мітку</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              placeholder="Назва мітки..."
              className="flex-1 bg-gray-600 text-white p-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewLabel({ ...newLabel, color })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newLabel.color === color ? 'border-white' : 'border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Додати
            </button>
          </div>
        </form>

        {/* Labels list */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Існуючі мітки</h3>
          {labels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏷️</div>
              <p>Немає міток. Створіть першу мітку вище.</p>
            </div>
          ) : (
            labels.map(label => (
              <LabelItem
                key={label.id}
                label={label}
                isEditing={editingLabel === label.id}
                onEdit={() => setEditingLabel(label.id)}
                onUpdate={handleUpdateLabel}
                onDelete={() => handleDeleteLabel(label.id)}
                onCancelEdit={() => setEditingLabel(null)}
                taskCount={getTasksByLabel(label.id).length}
                predefinedColors={predefinedColors}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LabelItem({ 
  label, 
  isEditing, 
  onEdit, 
  onUpdate, 
  onDelete, 
  onCancelEdit, 
  taskCount,
  predefinedColors 
}) {
  const [editName, setEditName] = useState(label.name);
  const [editColor, setEditColor] = useState(label.color);

  const handleSave = () => {
    if (!editName.trim()) return;
    onUpdate(label, { name: editName.trim(), color: editColor });
  };

  const handleCancel = () => {
    setEditName(label.name);
    setEditColor(label.color);
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 bg-gray-600 text-white p-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-1">
          {predefinedColors.map(color => (
            <button
              key={color}
              onClick={() => setEditColor(color)}
              className={`w-6 h-6 rounded-full border ${
                editColor === color ? 'border-white' : 'border-gray-500'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: label.color }}
        />
        <span className="font-medium">{label.name}</span>
        <span className="text-sm text-gray-400">({taskCount} завдань)</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-blue-400 text-sm"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-400 text-sm"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Label selector component for use in other forms
export function LabelSelector({ selectedLabels = [], onLabelsChange, className = '' }) {
  const { labels, addLabel } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');

  const handleToggleLabel = (labelId) => {
    const isSelected = selectedLabels.includes(labelId);
    if (isSelected) {
      onLabelsChange(selectedLabels.filter(id => id !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  const handleCreateLabel = (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    const newLabel = addLabel({
      name: newLabelName.trim(),
      color: '#3B82F6'
    });

    onLabelsChange([...selectedLabels, newLabel.id]);
    setNewLabelName('');
  };

  const selectedLabelObjects = labels.filter(label => selectedLabels.includes(label.id));

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <span className="text-sm">🏷️</span>
        <span className="text-sm">
          {selectedLabelObjects.length === 0 
            ? 'Додати мітки' 
            : `${selectedLabelObjects.length} міток`}
        </span>
        {isOpen ? '▲' : '▼'}
      </button>

      {/* Selected labels display */}
      {selectedLabelObjects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabelObjects.map(label => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
              <button
                onClick={() => handleToggleLabel(label.id)}
                className="hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-3">
            {/* Create new label */}
            <form onSubmit={handleCreateLabel} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Нова мітка..."
                  className="flex-1 text-xs bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                >
                  +
                </button>
              </div>
            </form>

            {/* Existing labels */}
            <div className="space-y-1">
              {labels.map(label => (
                <button
                  key={label.id}
                  onClick={() => handleToggleLabel(label.id)}
                  className={`w-full flex items-center gap-2 p-2 text-left text-sm rounded transition-colors ${
                    selectedLabels.includes(label.id)
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span>{label.name}</span>
                  {selectedLabels.includes(label.id) && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
