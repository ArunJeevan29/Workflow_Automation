// client/src/components/Modal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer, size = "md" }) {
  // Prevent scrolling on the background when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // THE FIX: Added dynamic width mapping based on the "size" prop passed from WorkflowBuilder
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg md:max-w-2xl",
    xl: "max-w-xl md:max-w-4xl" // Now the builder modal can get nice and wide!
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#041419]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} 
    >
      {/* THE FIX: Swapped max-w-md with the dynamic size class, removed overflow-hidden for dropdowns */}
      <div 
        className={`flex flex-col w-full ${currentSizeClass} bg-white shadow-2xl rounded-xl max-h-[90vh] animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable but dropdowns can escape) */}
        <div className="flex-1 p-6 overflow-y-auto overflow-x-visible custom-scrollbar bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}