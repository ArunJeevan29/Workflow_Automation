// client/src/components/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'solid',
  color = 'primary', 
  disabled = false,
  loading = false,
  size = 'md',
  icon: Icon,
  className = ''
}) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed btn-press";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg",
  };

  const styles = {
    solid: {
      primary: 'bg-[#58bfa1] hover:bg-[#4aa88d] text-white shadow-sm hover:shadow-md focus:ring-[#58bfa1]/50',
      success: 'bg-[#00b259] hover:bg-[#00994c] text-white shadow-sm hover:shadow-md focus:ring-[#00b259]/50',
      warning: 'bg-[#fbb03b] hover:bg-[#e09e35] text-white shadow-sm hover:shadow-md focus:ring-[#fbb03b]/50',
      info: 'bg-[#2f80ed] hover:bg-[#2a73d5] text-white shadow-sm hover:shadow-md focus:ring-[#2f80ed]/50',
      error: 'bg-[#eb5757] hover:bg-[#d44e4e] text-white shadow-sm hover:shadow-md focus:ring-[#eb5757]/50',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md focus:ring-gray-500/50',
    },
    outline: {
      primary: 'border-2 border-[#58bfa1] text-[#58bfa1] hover:bg-[#58bfa1] hover:text-white focus:ring-[#58bfa1]/50',
      success: 'border-2 border-[#00b259] text-[#00b259] hover:bg-[#00b259] hover:text-white focus:ring-[#00b259]/50',
      warning: 'border-2 border-[#fbb03b] text-[#fbb03b] hover:bg-[#fbb03b] hover:text-white focus:ring-[#fbb03b]/50',
      info: 'border-2 border-[#2f80ed] text-[#2f80ed] hover:bg-[#2f80ed] hover:text-white focus:ring-[#2f80ed]/50',
      error: 'border-2 border-[#eb5757] text-[#eb5757] hover:bg-[#eb5757] hover:text-white focus:ring-[#eb5757]/50',
      secondary: 'border-2 border-gray-300 text-gray-600 hover:bg-gray-600 hover:text-white focus:ring-gray-500/50',
    },
    ghost: {
      primary: 'text-[#58bfa1] hover:bg-teal-50 focus:ring-[#58bfa1]/50',
      success: 'text-[#00b259] hover:bg-green-50 focus:ring-[#00b259]/50',
      warning: 'text-[#fbb03b] hover:bg-orange-50 focus:ring-[#fbb03b]/50',
      info: 'text-[#2f80ed] hover:bg-blue-50 focus:ring-[#2f80ed]/50',
      error: 'text-[#eb5757] hover:bg-red-50 focus:ring-[#eb5757]/50',
      secondary: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500/50',
    },
    text: {
      primary: 'text-[#58bfa1] hover:underline focus:ring-[#58bfa1]/50',
      success: 'text-[#00b259] hover:underline focus:ring-[#00b259]/50',
      warning: 'text-[#fbb03b] hover:underline focus:ring-[#fbb03b]/50',
      info: 'text-[#2f80ed] hover:underline focus:ring-[#2f80ed]/50',
      error: 'text-[#eb5757] hover:underline focus:ring-[#eb5757]/50',
      secondary: 'text-gray-600 hover:underline focus:ring-gray-500/50',
    }
  };

  const activeStyle = styles[variant][color] || styles[variant].primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${activeStyle} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
}
