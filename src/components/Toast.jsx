import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Toast = ({ id, type = 'info', title, message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-600/90 border-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-600/90 border-red-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-600/90 border-yellow-500 text-white`;
      default:
        return `${baseStyles} bg-blue-600/90 border-blue-500 text-white`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`${getToastStyles()} animate-slide-in-right`}>
      <div className="text-lg">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium text-sm mb-1">{title}</h4>
        )}
        {message && (
          <p className="text-sm opacity-90">{message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white/70 hover:text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>,
    document.body
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ type = 'info', title, message, duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title, message, duration) => 
    addToast({ type: 'success', title, message, duration });
  
  const error = (title, message, duration) => 
    addToast({ type: 'error', title, message, duration });
  
  const warning = (title, message, duration) => 
    addToast({ type: 'warning', title, message, duration });
  
  const info = (title, message, duration) => 
    addToast({ type: 'info', title, message, duration });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />
  };
};

export default Toast;
