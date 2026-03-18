// client/src/components/Toggle.jsx
import React from'react';

export default function Toggle({ label, checked, onChange }) {
 return (
 // We use gap-3 to ensure the text and button NEVER overlap, even if squeezed
 <label className="flex items-center gap-3 cursor-pointer group">
 <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
 {label}
 </span>
 <button
 type="button"
 onClick={() => onChange(!checked)}
 className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
 ${checked ?'bg-[#58bfa1]' :'bg-gray-200 hover:bg-gray-300'}`}
 >
 <span
 className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
 ${checked ?'translate-x-4' :'translate-x-0'}`}
 />
 </button>
 </label>
 );
}