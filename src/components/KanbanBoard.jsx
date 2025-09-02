import React from 'react';
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
import useStore from '../store/useStore';


const SortableTaskCard = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} className="cursor-move">
        <TaskCard task={task} />
      </div>
    </div>
  );
};

const TaskCard = ({ task }) => {
  const setSelectedTaskId = useStore(state => state.setSelectedTaskId);
  const updateTask = useStore(state => state.updateTask);
  const deleteTask = useStore(state => state.deleteTask);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    updateTask(task.id, { completed: !task.completed });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteTask(task.id);
  };

  return (
    <div className={`bg-gray-800 p-3 rounded-lg border-l-4 ${getPriorityClass(task.priority)} hover:bg-gray-700`}>
      <div className="flex items-start justify-between gap-3">
        <div 
          onClick={() => setSelectedTaskId(task.id)}
          className="flex-1 cursor-pointer min-w-0"
        >
          <h4 className="font-bold text-white text-sm leading-tight mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-gray-400 leading-tight max-h-8 overflow-hidden">
              {task.description}
            </p>
          )}
        </div>
        <div 
          className="flex flex-col gap-1 flex-shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Toggle clicked for task:', task.id);
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Delete clicked for task:', task.id);
              deleteTask(task.id);
            }}
            className="text-gray-400 hover:text-red-400 text-xs cursor-pointer"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks }) => {
  const updateTask = useStore(state => state.updateTask);
  
  const todoTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine target column based on drop zone
    let targetCompleted = activeTask.completed;
    
    if (over.id === 'todo') {
      targetCompleted = false;
    } else if (over.id === 'completed') {
      targetCompleted = true;
    } else {
      // Dropped on another task - determine column by that task's status
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        targetCompleted = overTask.completed;
      }
    }
    
    if (activeTask.completed !== targetCompleted) {
      updateTask({ ...activeTask, completed: targetCompleted });
    }
  };

  return (
    <DndContext 
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* To Do Column */}
        <div className="bg-gray-800/50 rounded-lg p-4 min-h-[400px]">
          <h3 className="text-lg font-bold text-white mb-4">To Do ({todoTasks.length})</h3>
          <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 min-h-[300px]">
              {todoTasks.map(task => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        </div>

        {/* Completed Column */}
        <div className="bg-gray-800/50 rounded-lg p-4 min-h-[400px]">
          <h3 className="text-lg font-bold text-white mb-4">Completed ({completedTasks.length})</h3>
          <SortableContext items={completedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 min-h-[300px]">
              {completedTasks.map(task => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
