// client/src/components/Pagination.jsx
import React from'react';
import { ChevronLeft, ChevronRight } from'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
 const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

 return (
 <div className="flex items-center justify-start space-x-1 py-4">
 <button
 onClick={() => onPageChange(currentPage - 1)}
 disabled={currentPage === 1}
 className="p-1 text-gray-500 transition-colors hover:text-[#58bfa1] disabled:opacity-30 disabled:hover:text-gray-500"
 >
 <ChevronLeft className="w-5 h-5" />
 </button>

 {pages.map(page => (
 <button
 key={page}
 onClick={() => onPageChange(page)}
 className={`flex items-center justify-center w-8 h-8 text-sm transition-colors rounded-full
 ${currentPage === page 
 ?'bg-[#58bfa1] text-white font-medium shadow-sm' 
 :'text-gray-600 hover:bg-gray-100 hover:text-[#58bfa1]'
 }`}
 >
 {page}
 </button>
 ))}

 <button
 onClick={() => onPageChange(currentPage + 1)}
 disabled={currentPage === totalPages}
 className="p-1 text-gray-500 transition-colors hover:text-[#58bfa1] disabled:opacity-30 disabled:hover:text-gray-500"
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 );
}