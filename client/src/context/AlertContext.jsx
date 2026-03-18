// client/src/context/AlertContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((type, message, delay = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, type, message }]);

    if (delay > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, delay);
    }
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {/* Tighter gap (gap-2) between stacked alerts */}
      <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} onClose={() => removeAlert(alert.id)} />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

const AlertItem = ({ alert, onClose }) => {
  const { type, message } = alert;

  const styles = {
    success: {
      leftBlock: 'bg-[#10b981]',
      rightBlock: 'bg-[#d1fae5]', 
      Icon: CheckCircle2
    },
    danger: {
      leftBlock: 'bg-[#ef4444]',  
      rightBlock: 'bg-[#fee2e2]', 
      Icon: AlertCircle
    },
    warning: {
      leftBlock: 'bg-[#f59e0b]',  
      rightBlock: 'bg-[#fef3c7]', 
      Icon: AlertCircle 
    },
    primary: {
      leftBlock: 'bg-[#3b82f6]',  
      rightBlock: 'bg-[#dbeafe]', 
      Icon: Info
    },
    info: { 
      leftBlock: 'bg-[#3b82f6]',  
      rightBlock: 'bg-[#dbeafe]', 
      Icon: Info
    }
  };

  const currentStyle = styles[type] || styles.primary;
  const IconComp = currentStyle.Icon;

  return (
    // Reduced overall width (w-64 sm:w-72) and rounded corners to a slightly tighter 'rounded'
    <div className={`pointer-events-auto flex w-64 sm:w-72 rounded shadow-md overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300 ${currentStyle.rightBlock}`}>
      
      {/* Slimmer Left Solid Color Block (w-10 instead of w-12) */}
      <div className={`flex items-center justify-center w-10 shrink-0 ${currentStyle.leftBlock} text-white`}>
        <IconComp size={18} strokeWidth={2} />
      </div>
      
      {/* Tighter padding on Right Content Area (px-3 py-2.5) */}
      <div className="flex items-center justify-between flex-1 px-3 py-2.5">
        <span className="text-[13px] font-semibold text-gray-700 leading-snug">{message}</span>
        
        {/* Smaller Close Button */}
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 ml-2 focus:outline-none"
          title="Close"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
      
    </div>
  );
};