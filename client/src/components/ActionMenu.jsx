// client/src/components/ActionMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export default function ActionMenu({ actions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom');
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // If the button is too close to the bottom of the window (less than 200px), open upwards
    if (window.innerHeight - rect.bottom < 200) {
      setMenuPosition('top');
    } else {
      setMenuPosition('bottom');
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className={`flex items-center justify-center p-1.5 rounded-md transition-colors focus:outline-none
        ${isOpen ? 'bg-teal-50 text-[#58bfa1]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 z-[100] w-36 origin-top-right bg-white border border-gray-100 rounded-lg shadow-xl focus:outline-none overflow-hidden
          ${menuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}
        `}>
          <div className="py-1">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
                className={`flex items-center justify-start w-full px-4 py-2.5 text-sm font-medium transition-colors
                ${action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <action.icon className={`w-4 h-4 mr-2 ${action.danger ? 'text-red-500' : 'text-gray-400'}`} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}