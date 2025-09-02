import React, { useState } from 'react';
import useStore from '../store/useStore';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CalendarView() {
  const { tasks, updateTask, addTask, setSelectedTaskId } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  // Generate calendar grid
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      days.push(
        <CalendarDay
          key={day}
          day={cloneDay}
          formattedDate={formattedDate}
          isCurrentMonth={isSameMonth(day, monthStart)}
          isToday={isToday(day)}
          tasks={getTasksForDate(day)}
          onTaskClick={(task) => setSelectedTaskId(task.id)}
          onQuickAdd={() => setShowQuickAdd(cloneDay)}
          showQuickAdd={showQuickAdd && isSameDay(showQuickAdd, cloneDay)}
          quickTaskTitle={quickTaskTitle}
          setQuickTaskTitle={setQuickTaskTitle}
          onAddTask={handleQuickAddTask}
          onCancelAdd={() => setShowQuickAdd(null)}
        />
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  function getTasksForDate(date) {
    return tasks.filter(task => 
      task.dueDate && isSameDay(parseISO(task.dueDate), date)
    );
  }

  function handleQuickAddTask(date) {
    if (!quickTaskTitle.trim()) return;
    
    addTask({
      title: quickTaskTitle,
      description: '',
      priority: 'medium',
      dueDate: date.toISOString(),
      projectId: null
    });
    
    setQuickTaskTitle('');
    setShowQuickAdd(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const task = tasks.find(t => t.id === active.id);
      const newDate = new Date(over.id);
      
      if (task) {
        updateTask({
          ...task,
          dueDate: newDate.toISOString()
        });
      }
    }
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Календар завдань</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              ←
            </button>
            <h3 className="text-lg font-semibold text-white min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              →
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="space-y-1">
            {rows}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function CalendarDay({ 
  day, 
  formattedDate, 
  isCurrentMonth, 
  isToday, 
  tasks, 
  onTaskClick, 
  onQuickAdd,
  showQuickAdd,
  quickTaskTitle,
  setQuickTaskTitle,
  onAddTask,
  onCancelAdd
}) {
  return (
    <div
      className={`min-h-[120px] p-2 border border-gray-600 rounded ${
        isCurrentMonth ? 'bg-gray-700' : 'bg-gray-800'
      } ${isToday ? 'ring-2 ring-blue-500' : ''} hover:bg-gray-600 transition-colors`}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${
          isCurrentMonth ? 'text-white' : 'text-gray-500'
        } ${isToday ? 'text-blue-400' : ''}`}>
          {formattedDate}
        </span>
        <button
          onClick={onQuickAdd}
          className="text-xs text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          +
        </button>
      </div>

      {/* Tasks */}
      <div className="space-y-1">
        {tasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>

      {/* Quick add form */}
      {showQuickAdd && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={quickTaskTitle}
            onChange={(e) => setQuickTaskTitle(e.target.value)}
            placeholder="Нове завдання..."
            className="w-full text-xs bg-gray-600 text-white p-1 rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onAddTask(day);
              } else if (e.key === 'Escape') {
                onCancelAdd();
              }
            }}
          />
          <div className="flex gap-1">
            <button
              onClick={() => onAddTask(day)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            >
              ✓
            </button>
            <button
              onClick={onCancelAdd}
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DraggableTask({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    high: 'bg-red-500/80',
    medium: 'bg-yellow-500/80',
    low: 'bg-green-500/80'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
        priorityColors[task.priority]
      } ${task.completed ? 'opacity-50 line-through' : ''} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="text-white font-medium truncate">
        {task.title}
      </div>
    </div>
  );
}
