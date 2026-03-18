import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, List, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { label: 'Workflows', path: '/', icon: Home, separator: false },
    { label: 'Audit Logs', path: '/audit-logs', icon: List, separator: false },
    { label: 'Settings', path: '/settings', icon: Settings, separator: true },
  ];

  return (
    <aside 
      className={`relative flex flex-col h-screen bg-[#111827] text-gray-300 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-center h-20 border-b border-gray-800">
        {isCollapsed ? (
          <img 
            src="/favicon.svg" 
            alt="HaloFlow" 
            className="w-8 h-8"
          />
        ) : (
          <div className="flex items-center gap-2">
            <img 
              src="/haloflow-logo.svg" 
              alt="HaloFlow" 
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-white tracking-tight">HaloFlow</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <React.Fragment key={item.path}>
            {item.separator && <div className="my-4 border-t border-gray-800"></div>}
            <NavLink
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 transition-colors group
                ${isActive 
                  ? 'bg-teal-900/30 text-[#58bfa1]' 
                  : 'hover:bg-gray-800 hover:text-white'
                }`}
            >
              <item.icon className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-[#1f2937] border border-gray-700 rounded-full p-1 hover:bg-[#374151] transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* User Section */}
      <div className="p-3 border-t border-gray-800">
        <button
          className={`flex items-center w-full px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
