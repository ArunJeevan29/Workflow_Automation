// client/src/pages/AuditLogs.jsx
import React, { useState, useEffect } from'react';
import { Search, Filter, Eye } from'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useNavigate } from'react-router-dom';
import api from'../utils/axios';

import Table from'../components/Table';
import Badge from'../components/Badge';
import Pagination from'../components/Pagination';

export default function AuditLogs() {
 const navigate = useNavigate();
 const { showAlert } = useAlert();
 const [logs, setLogs] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 
 const [searchTerm, setSearchTerm] = useState('');
 const [filterType, setFilterType] = useState('All');
 const [isFilterOpen, setIsFilterOpen] = useState(false);
 
 const [currentPage, setCurrentPage] = useState(1);
 const recordsPerPage = 10; 

 useEffect(() => {
 fetchLogs();
 }, []);

 const fetchLogs = async () => {
 try {
 setIsLoading(true);
 const response = await api.get('/executions'); 
 setLogs(response.data.data || []);
 } catch (error) {
 console.error(error);
 showAlert('danger', 'Failed to load audit logs.');
 } finally {
 setIsLoading(false);
 }
 };

 const filteredLogs = logs.filter(log => {
 const searchLower = searchTerm.toLowerCase();
 const idMatch = (log._id?.toLowerCase() || '').includes(searchLower);
 const nameMatch = (log.workflow_id?.name?.toLowerCase() || '').includes(searchLower);
 const matchesSearch = idMatch || nameMatch;

 let matchesFilter = true;
 if (filterType !=='All') {
 const s = (log.status ||'').toUpperCase();
 if (filterType ==='Completed') matchesFilter = s ==='COMPLETED';
 if (filterType ==='Failed') matchesFilter = s ==='FAILED';
 if (filterType ==='In Progress') matchesFilter = ['IN_PROGRESS','PENDING'].includes(s);
 if (filterType ==='Canceled') matchesFilter = s ==='CANCELED';
 }

 return matchesSearch && matchesFilter;
 });

 const totalPages = Math.max(1, Math.ceil(filteredLogs.length / recordsPerPage));
 const currentTableData = filteredLogs.slice(
 (currentPage - 1) * recordsPerPage, 
 currentPage * recordsPerPage
 );

 const formatDate = (dateString) => {
 if (!dateString) return'--';
 const date = new Date(dateString);
 return new Intl.DateTimeFormat('en-US', {
 month:'short', day:'numeric', year:'numeric',
 hour:'2-digit', minute:'2-digit', second:'2-digit'
 }).format(date);
 };

 const getStatusBadge = (status) => {
 const s = (status ||'').toUpperCase();
 switch(s) {
 case'COMPLETED': return <Badge text="Completed" status="success" />;
 case'FAILED': return <Badge text="Failed" status="error" />;
 case'IN_PROGRESS': 
 case'PENDING': return <Badge text="In Progress" status="info" />;
 case'CANCELED': return <Badge text="Canceled" status="default" />;
 default: return <Badge text={status} status="default" />;
 }
 };

 const columns = [
 { 
 label:'Execution ID', 
 key:'_id',
 render: (val) => <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1">{val.substring(0, 8)}</span>
 },
 { 
 label:'Workflow', 
 key:'workflow_id',
 render: (val) => <span className="font-semibold text-gray-900">{val ? val.name :'Deleted Workflow'}</span>
 },
 { 
 label:'Version', 
 key:'workflow_version',
 render: (val) => <span className="text-gray-500">v{val}</span>
 }, 
 { 
 label:'Status', 
 key:'status', 
 render: getStatusBadge
 },
 { 
 label:'Started By', 
 key:'triggered_by',
 render: (val) => <span className="text-sm text-gray-700">{val}</span>
 }, 
 { 
 label:'Start Time', 
 key:'started_at', 
 render: (val) => <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(val)}</span>
 },
 { 
 label:'End Time', 
 key:'ended_at', 
 render: (val) => <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(val)}</span>
 },
 { 
 label:'Actions', 
 key:'actions',
 render: (_, log) => (
 <button 
 onClick={() => navigate(`/execute/${log._id}`)}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#58bfa1] hover:bg-teal-50 transition-colors border border-transparent hover:border-teal-100 whitespace-nowrap"
 >
 <Eye className="w-4 h-4" /> View Logs
 </button>
 )
 }
 ];

 return (
 <div className="space-y-6 animate-in fade-in duration-500">
 
 {/* Top Header & Search/Filter Row */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit & Logs</h1>
 <p className="mt-1 text-sm text-gray-500">Track and monitor all historical workflow executions.</p>
 </div>

 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input 
 type="text" 
 placeholder="Search ID or workflow..." 
 value={searchTerm}
 onChange={(e) => {
 setSearchTerm(e.target.value);
 setCurrentPage(1); 
 }}
 className="pl-9 pr-4 py-2 border border-gray-200 text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#58bfa1] focus:border-[#58bfa1]" 
 />
 </div>
 <div className="relative">
 <button 
 onClick={() => setIsFilterOpen(!isFilterOpen)}
 className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
 >
 <Filter className="w-4 h-4" />
 <span className="hidden sm:inline">{filterType}</span>
 </button>
 
 {isFilterOpen && (
 <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 shadow-lg z-50 py-1">
 {['All','Completed','Failed','In Progress','Canceled'].map(type => (
 <button
 key={type}
 onClick={() => {
 setFilterType(type);
 setIsFilterOpen(false);
 setCurrentPage(1);
 }}
 className={`block w-full text-left px-4 py-2 text-sm transition-colors ${filterType === type ?'bg-teal-50 text-[#58bfa1] font-semibold' :'text-gray-700 hover:bg-gray-50'}`}
 >
 {type}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Table Section with Horizontal Scroll Fix */}
 <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-t-md">
 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : (
 <>
 <div className="overflow-x-auto w-full">
 {/* Removed the fixed min-w wrapper to prevent the vertical line artifact */}
 <div className="inline-block min-w-full align-middle">
 <Table 
 columns={columns} 
 data={currentTableData} 
 emptyMessage={searchTerm ?"No logs match your search." :"No execution logs found."} 
 />
 </div>
 </div>
 {totalPages > 1 && (
 <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
 <span className="text-sm text-gray-500">
 Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
 </span>
 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
 </div>
 )}
 </>
 )}
 </div>
 </div>
 );
}