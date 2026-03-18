// client/src/components/Table.jsx
import React from 'react';

export default function Table({ columns, data, emptyMessage = "No data available.", onRowClick }) {
  return (
    // THE FIX: Changed overflow-hidden to overflow-visible so the dropdown menu can escape!
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-card overflow-visible">
      {/* THE FIX: Removed overflow-x-auto and replaced with overflow-visible */}
      <div className="w-full overflow-visible">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.isAction ? 'w-24' : ''}
                    ${index === 0 ? 'rounded-tl-xl' : ''} 
                    ${index === columns.length - 1 ? 'rounded-tr-xl' : ''}
                  `}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`transition-all duration-200 hover:bg-gray-50/70 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`px-6 py-4 text-sm text-gray-700 overflow-visible
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                        ${onRowClick ? 'group' : ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-sm text-center text-gray-400 bg-gray-50/30 rounded-b-xl">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="block font-medium text-gray-500 mb-1">{emptyMessage}</span>
                    <span className="text-xs text-gray-400">Adjust your filters or create a new record.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}