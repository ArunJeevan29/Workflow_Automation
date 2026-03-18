// client/src/context/ConfirmContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [promptConfig, setPromptConfig] = useState(null);

  const confirmAction = useCallback((options) => {
    return new Promise((resolve) => {
      setConfig({
        ...options,
        resolve
      });
    });
  }, []);

  const promptAction = useCallback((options) => {
    return new Promise((resolve) => {
      setPromptConfig({
        ...options,
        resolve
      });
    });
  }, []);

  const handleConfirm = () => {
    if (config?.resolve) {
      config.resolve(true);
    }
    setConfig(null);
  };

  const handleCancel = () => {
    if (config?.resolve) {
      config.resolve(false);
    }
    setConfig(null);
  };

  const handlePromptConfirm = (value) => {
    if (promptConfig?.resolve) {
      promptConfig.resolve(value);
    }
    setPromptConfig(null);
  };

  const handlePromptCancel = () => {
    if (promptConfig?.resolve) {
      promptConfig.resolve(null);
    }
    setPromptConfig(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirmAction, promptAction }}>
      {children}
      {config && (
        <ConfirmDialog
          isOpen={!!config}
          title={config.title || 'Confirm Action'}
          message={config.message || 'Are you sure?'}
          type={config.type || 'warning'}
          confirmText={config.confirmText || 'Confirm'}
          cancelText={config.cancelText || 'Cancel'}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {promptConfig && (
        <PromptDialog
          isOpen={!!promptConfig}
          title={promptConfig.title || 'Enter Value'}
          message={promptConfig.message || 'Please enter a value:'}
          defaultValue={promptConfig.defaultValue || ''}
          type={promptConfig.type || 'info'}
          confirmText={promptConfig.confirmText || 'Submit'}
          cancelText={promptConfig.cancelText || 'Cancel'}
          onConfirm={handlePromptConfirm}
          onCancel={handlePromptCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

// Confirmation Dialog Component with Halleyx Design
const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm, 
  onCancel 
}) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus trap - focus first element
      const confirmBtn = document.getElementById('confirm-btn');
      if (confirmBtn) confirmBtn.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: '🔴',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
      confirmText: 'Cancel'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      confirmText: 'Continue'
    },
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      confirmBtn: 'bg-[#58bfa1] hover:bg-teal-600 text-white',
      confirmText: 'Confirm'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBtn: 'bg-[#58bfa1] hover:bg-teal-600 text-white',
      confirmText: 'Confirm'
    }
  };

  const styles = typeStyles[type] || typeStyles.warning;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#041419]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="flex flex-col w-full max-w-md bg-white shadow-2xl rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-white">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg}`}>
            <span className="text-2xl">{styles.icon}</span>
          </div>
          <h2 id="confirm-title" className="text-lg font-bold text-gray-900">{title}</h2>
        </div>

        {/* Body */}
        <div className="p-6 bg-white">
          <p id="confirm-message" className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelText}
          </button>
          <button
            id="confirm-btn"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn} focus:ring-offset-gray-50`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Prompt Dialog Component with Input Field
const PromptDialog = ({ 
  isOpen, 
  title, 
  message, 
  defaultValue = '',
  type = 'info',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  onConfirm, 
  onCancel 
}) => {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    if (isOpen) {
      setInputValue(defaultValue);
      document.addEventListener('keydown', handleEscape);
      // Focus the input field
      setTimeout(() => {
        const inputEl = document.getElementById('prompt-input');
        if (inputEl) inputEl.focus();
      }, 100);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, defaultValue, onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
    }
  };

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: '🔴',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: '💰',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      confirmBtn: 'bg-[#58bfa1] hover:bg-teal-600 text-white'
    },
    info: {
      icon: '💵',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmBtn: 'bg-[#58bfa1] hover:bg-teal-600 text-white'
    }
  };

  const styles = typeStyles[type] || typeStyles.info;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#041419]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="flex flex-col w-full max-w-md bg-white shadow-2xl rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-white">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg}`}>
            <span className="text-2xl">{styles.icon}</span>
          </div>
          <h2 id="prompt-title" className="text-lg font-bold text-gray-900">{title}</h2>
        </div>

        {/* Body with Form */}
        <form onSubmit={handleSubmit} className="p-6 bg-white">
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <input
            id="prompt-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#58bfa1] focus:border-transparent transition-all"
            placeholder="Enter value..."
            autoComplete="off"
          />
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelText}
          </button>
          <button
            id="prompt-btn"
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn} focus:ring-offset-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
