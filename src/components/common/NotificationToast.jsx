import React from 'react';
import { FaTimes, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useError } from '../../contexts/ErrorContext';

const NotificationToast = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg animate-fade-in ${getBackgroundColor(error.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(error.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {error.message}
            </p>
            {error.timestamp && (
              <p className="text-xs text-gray-500 mt-1">
                {error.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={() => removeError(error.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;