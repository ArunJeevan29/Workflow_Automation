// client/src/components/Select.jsx
import React, { useState, useRef, useEffect } from'react';
import { createPortal } from'react-dom';
import { ChevronDown } from'lucide-react';
import usePortal from'../utils/usePortal';

export default function Select({ 
 label, 
 options = [], 
 value, 
 onChange, 
 placeholder ="Select...",
 required = false,
 error
}) {
 const [isOpen, setIsOpen] = useState(false);
 const triggerRef = useRef(null);
 const [menuStyle, setMenuStyle] = useState({});

 const selectedOption = options.find(opt => opt.value === value);
 const portalNode = usePortal('select-portal-root');

 const updateMenuPosition = () => {
 if (!triggerRef.current || !isOpen) return;
 const rect = triggerRef.current.getBoundingClientRect();
 setMenuStyle({
 position:'absolute',
 top:`${rect.bottom + window.scrollY}px`,
 left:`${rect.left + window.scrollX}px`,
 width:`${rect.width}px`,
 zIndex: 9999,
 });
 };

 useEffect(() => {
 if (isOpen) {
 updateMenuPosition();
 window.addEventListener('resize', updateMenuPosition);
 window.addEventListener('scroll', updateMenuPosition, true);
 }
 return () => {
 window.removeEventListener('resize', updateMenuPosition);
 window.removeEventListener('scroll', updateMenuPosition, true);
 };
 }, [isOpen]);

 // Handle clicking outside to close
 useEffect(() => {
 function handleClickOutside(event) {
 const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(event.target);
 const isOutsideMenu = portalNode && !portalNode.contains(event.target);

 if (isOutsideTrigger && isOutsideMenu) {
 setIsOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [portalNode]);

 const menuContent = (
 <div style={menuStyle} className="mt-1 bg-white border border-gray-100 shadow-xl focus:outline-none animate-in fade-in duration-100 rounded-b-md">
 <ul className="py-1 max-h-60 overflow-auto custom-scrollbar">
 {options.map((option, idx) => (
 <li 
 key={idx}
 onClick={() => {
 onChange(option.value);
 setIsOpen(false);
 }}
 className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
 ${value === option.value ?'bg-teal-50 text-[#58bfa1] font-medium' :'text-gray-700 hover:bg-gray-50'}`}
 >
 {option.label}
 </li>
 ))}
 </ul>
 </div>
 );

 return (
 <div className="flex flex-col mb-4 relative">
 {label && (
 <label className="mb-1 text-sm font-medium text-gray-700">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 )}

 <div 
 ref={triggerRef}
 onClick={() => setIsOpen(!isOpen)}
 className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white cursor-pointer transition-colors 
 ${error ?'border border-red-500 ring-1 ring-red-500' :'border border-gray-300 hover:border-gray-400 focus:border-[#58bfa1] focus:ring-[#58bfa1]'}
 ${isOpen ?'ring-1 ring-[#58bfa1] border-[#58bfa1] shadow-inner' :''}`}
 >
 <span className={selectedOption ?'text-gray-900' :'text-gray-400'}>
 {selectedOption ? selectedOption.label : placeholder}
 </span>
 <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ?'rotate-180' :''}`} />
 </div>

 {isOpen && portalNode && createPortal(menuContent, portalNode)}
 
 {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
 </div>
 );
}