import React, { useState } from 'react';
import { format, addDays, addWeeks, addMonths, isToday, isTomorrow, isThisWeek } from 'date-fns';

export default function DatePicker({ value, onChange, onRemove, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const quickOptions = [
    { label: 'Сьогодні', value: new Date(), icon: '📅' },
    { label: 'Завтра', value: addDays(new Date(), 1), icon: '🌅' },
    { label: 'Наступний тиждень', value: addWeeks(new Date(), 1), icon: '📆' },
    { label: 'Наступний місяць', value: addMonths(new Date(), 1), icon: '🗓️' }
  ];

  const recurringOptions = [
    { label: 'Щодня', value: 'daily', icon: '🔄' },
    { label: 'Щотижня', value: 'weekly', icon: '📅' },
    { label: 'Щомісяця', value: 'monthly', icon: '🗓️' },
    { label: 'Щороку', value: 'yearly', icon: '📆' }
  ];

  const formatDisplayDate = (date) => {
    if (!date) return 'Встановити дедлайн';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isToday(dateObj)) return 'Сьогодні';
    if (isTomorrow(dateObj)) return 'Завтра';
    if (isThisWeek(dateObj)) return format(dateObj, 'EEEE');
    
    return format(dateObj, 'dd MMM yyyy');
  };

  const handleQuickSelect = (selectedDate) => {
    onChange(selectedDate.toISOString());
    setIsOpen(false);
  };

  const handleCustomDateChange = (e) => {
    const dateValue = e.target.value;
    setCustomDate(dateValue);
    if (dateValue) {
      const selectedDate = new Date(dateValue);
      onChange(selectedDate.toISOString());
    }
  };

  const handleRemove = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          value 
            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30' 
            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
        }`}
      >
        <span className="text-sm">📅</span>
        <span className="text-sm">{formatDisplayDate(value)}</span>
        {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* Quick Options */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Швидкий вибір</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleQuickSelect(option.value)}
                    className="flex items-center gap-2 p-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Конкретна дата</h4>
              <input
                type="date"
                value={customDate}
                onChange={handleCustomDateChange}
                className="w-full bg-gray-700 border border-gray-600 text-white p-2 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Recurring Options */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Повторення</h4>
              <div className="grid grid-cols-2 gap-2">
                {recurringOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      // This will be handled by parent component
                      console.log('Recurring pattern:', option.value);
                    }}
                    className="flex items-center gap-2 p-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-600">
              {value && (
                <button
                  onClick={handleRemove}
                  className="flex-1 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded transition-colors"
                >
                  🗑️ Видалити дедлайн
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reminder component for due date notifications
export function ReminderPicker({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  const reminderOptions = [
    { label: 'За 5 хвилин', value: 5 },
    { label: 'За 15 хвилин', value: 15 },
    { label: 'За 30 хвилин', value: 30 },
    { label: 'За 1 годину', value: 60 },
    { label: 'За 2 години', value: 120 },
    { label: 'За 1 день', value: 1440 },
    { label: 'За 1 тиждень', value: 10080 }
  ];

  const formatReminderText = (minutes) => {
    if (!minutes) return 'Встановити нагадування';
    
    const option = reminderOptions.find(opt => opt.value === minutes);
    return option ? option.label : `За ${minutes} хвилин`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          value 
            ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300 hover:bg-yellow-600/30' 
            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
        }`}
      >
        <span className="text-sm">🔔</span>
        <span className="text-sm">{formatReminderText(value)}</span>
        {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="p-2">
            {reminderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left p-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
              >
                {option.label}
              </button>
            ))}
            
            {value && (
              <div className="border-t border-gray-600 mt-2 pt-2">
                <button
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2 text-sm text-red-400 hover:bg-red-500/20 rounded transition-colors"
                >
                  🗑️ Видалити нагадування
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
