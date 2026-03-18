import React from'react';

export default function TextInput({ 
 label, 
 name, 
 value, 
 onChange, 
 placeholder, 
 type ='text', 
 error,
 required = false
}) {
 return (
 <div className="flex flex-col mb-4">
 {label && (
 <label htmlFor={name} className="mb-1 text-sm font-medium text-gray-700">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 )}
 <input
 id={name}
 name={name}
 type={type}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 className={`px-3 py-2 border text-sm transition-colors focus:outline-none focus:ring-1 
 ${error 
 ?'border-red-500 focus:border-red-500 focus:ring-red-500' 
 :'border-gray-300 focus:border-[#58bfa1] focus:ring-[#58bfa1]'
 }`}
 />
 {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
 </div>
 );
}