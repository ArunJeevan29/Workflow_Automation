// client/src/components/MetricCard.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  colorClass = "text-[#58bfa1]", 
  bgClass = "bg-teal-50",
  subtitle
}) {
  // Get the actual color value for the accent bar
  const getAccentColor = () => {
    if (colorClass.includes('green') || colorClass.includes('emerald')) return '#10b981';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('red') || colorClass.includes('error')) return '#ef4444';
    if (colorClass.includes('amber') || colorClass.includes('warning')) return '#f59e0b';
    if (colorClass.includes('purple')) return '#8b5cf6';
    return '#58bfa1';
  };

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
      {/* Accent bar at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
        style={{ backgroundColor: getAccentColor() }}
      />
      
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wide">{title}</h3>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${bgClass} ${colorClass} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h2>
        {subtitle && (
          <span className="text-sm text-gray-400 font-medium">{subtitle}</span>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trendUp ? (
            <span className="flex items-center text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-100">
              <TrendingUp className="w-3 h-3 mr-1.5" /> 
              <span>{trend}</span>
            </span>
          ) : (
            <span className="flex items-center text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-lg text-xs border border-red-100">
              <TrendingDown className="w-3 h-3 mr-1.5" /> 
              <span>{trend}</span>
            </span>
          )}
          <span className="text-gray-400 font-medium ml-2 text-xs">vs last period</span>
        </div>
      )}
    </div>
  );
}
