// client/src/components/Badge.jsx
import React from 'react';
import { Bell } from 'lucide-react';

export default function Badge({ 
  icon = null, 
  count = null, 
  text = null, 
  status = 'default',
  showDot = false 
}) {
  if (icon || count) {
    return (
      <div className="relative inline-flex items-center justify-center p-2">
        {icon === 'bell' ? <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" /> : icon}
        {count && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#58bfa1] rounded-full ring-2 ring-white shadow-sm">
            {count}
          </span>
        )}
      </div>
    );
  }

  // Modern SaaS color palette for badges
  const statusStyles = {
    active: 'bg-teal-50 text-[#45a387] border border-teal-100',
    completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    failed: 'bg-red-50 text-red-600 border border-red-100',
    error: 'bg-red-50 text-red-600 border border-red-100',
    canceled: 'bg-gray-100 text-gray-600 border border-gray-200',
    pending: 'bg-amber-50 text-amber-600 border border-amber-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-100',
    info: 'bg-blue-50 text-blue-600 border border-blue-100',
    default: 'bg-gray-50 text-gray-600 border border-gray-200'
  };

  // Dot colors for status indicators
  const dotColors = {
    active: 'bg-[#58bfa1]',
    completed: 'bg-emerald-500',
    success: 'bg-emerald-500',
    failed: 'bg-red-500',
    error: 'bg-red-500',
    canceled: 'bg-gray-400',
    pending: 'bg-amber-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    default: 'bg-gray-400'
  };

  const activeStyle = statusStyles[status.toLowerCase()] || statusStyles.default;
  const dotColor = dotColors[status.toLowerCase()] || dotColors.default;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${activeStyle}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>}
      {text}
    </span>
  );
}
