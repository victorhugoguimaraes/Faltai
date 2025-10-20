import React, { createContext, useContext, useState } from 'react';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const addError = (error, duration = 5000) => {
    const errorObj = {
      id: Date.now() + Math.random(),
      message: typeof error === 'string' ? error : error.message,
      type: 'error',
      timestamp: new Date()
    };

    setErrors(prev => [...prev, errorObj]);

    // Auto-remove error after duration
    if (duration > 0) {
      setTimeout(() => {
        removeError(errorObj.id);
      }, duration);
    }

    return errorObj.id;
  };

  const addWarning = (message, duration = 4000) => {
    const warningObj = {
      id: Date.now() + Math.random(),
      message,
      type: 'warning',
      timestamp: new Date()
    };

    setErrors(prev => [...prev, warningObj]);

    if (duration > 0) {
      setTimeout(() => {
        removeError(warningObj.id);
      }, duration);
    }

    return warningObj.id;
  };

  const addSuccess = (message, duration = 3000) => {
    const successObj = {
      id: Date.now() + Math.random(),
      message,
      type: 'success',
      timestamp: new Date()
    };

    setErrors(prev => [...prev, successObj]);

    if (duration > 0) {
      setTimeout(() => {
        removeError(successObj.id);
      }, duration);
    }

    return successObj.id;
  };

  const removeError = (id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const value = {
    errors,
    addError,
    addWarning,
    addSuccess,
    removeError,
    clearErrors
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};