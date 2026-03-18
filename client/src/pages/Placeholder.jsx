import React from'react';
import { Settings } from'lucide-react';

export default function Placeholder({ title, description }) {
 return (
 <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in fade-in duration-500">
 <div className="p-4 bg-teal-50 text-[#58bfa1] mb-4">
 <Settings className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
 </div>
 <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
 <p className="mt-2 text-sm text-gray-500 max-w-sm">
 {description ||'This module is currently under development. Check back soon for updates.'}
 </p>
 </div>
 );
}