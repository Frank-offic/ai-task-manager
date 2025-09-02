import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes, parseISO } from 'date-fns';

export default function NotificationSystem({ tasks }) {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const newNotifications = [];

      tasks.forEach(task => {
        if (task.completed || !task.dueDate) return;

        const dueDate = parseISO(task.dueDate);
        const minutesUntilDue = differenceInMinutes(dueDate, now);

        // Due date reminders
        if (task.dueDateReminder && minutesUntilDue <= task.dueDateReminder && minutesUntilDue > 0) {
          newNotifications.push({
            id: `reminder-${task.id}`,
            type: 'reminder',
            title: 'Нагадування про дедлайн',
            message: `Завдання "${task.title}" має бути виконане через ${minutesUntilDue} хвилин`,
            taskId: task.id,
            timestamp: now,
            priority: task.priority
          });
        }

        // Overdue notifications
        if (minutesUntilDue < 0) {
          const hoursOverdue = Math.abs(Math.floor(minutesUntilDue / 60));
          newNotifications.push({
            id: `overdue-${task.id}`,
            type: 'overdue',
            title: 'Прострочене завдання',
            message: `Завдання "${task.title}" прострочене на ${hoursOverdue} годин`,
            taskId: task.id,
            timestamp: now,
            priority: 'high'
          });
        }
      });

      // Remove duplicate notifications
      const existingIds = notifications.map(n => n.id);
      const uniqueNew = newNotifications.filter(n => !existingIds.includes(n.id));
      
      if (uniqueNew.length > 0) {
        setNotifications(prev => [...prev, ...uniqueNew]);
        setIsVisible(true);
      }
    };

    // Check immediately and then every minute
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [tasks, notifications]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
    setIsVisible(false);
  };

  if (!isVisible || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.slice(0, 5).map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
      
      {notifications.length > 5 && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-center">
          <p className="text-gray-300 text-sm">
            +{notifications.length - 5} більше сповіщень
          </p>
          <button
            onClick={dismissAll}
            className="text-blue-400 hover:text-blue-300 text-sm mt-1"
          >
            Закрити всі
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationCard({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-dismiss after 10 seconds for reminders
    if (notification.type === 'reminder') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.type, onDismiss]);

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'overdue':
        return 'bg-red-600/20 border-red-500/50 text-red-300';
      case 'reminder':
        return 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300';
      case 'achievement':
        return 'bg-green-600/20 border-green-500/50 text-green-300';
      default:
        return 'bg-blue-600/20 border-blue-500/50 text-blue-300';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'overdue': return '⚠️';
      case 'reminder': return '🔔';
      case 'achievement': return '🎉';
      default: return 'ℹ️';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 shadow-lg transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getNotificationStyle()}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-xs opacity-90 mt-1">{notification.message}</p>
          <p className="text-xs opacity-70 mt-2">
            {format(notification.timestamp, 'HH:mm')}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
