// client/src/pages/LiveExecutions.jsx
import React, { useState, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { Activity, Search, Filter, Eye, RefreshCw, Clock, User, Calendar, Play, XCircle } from'lucide-react';
import api from'../utils/axios';
import { useAlert } from '../context/AlertContext';

import Table from'../components/Table';
import Badge from'../components/Badge';
import Pagination from'../components/Pagination';
import Button from'../components/Button';

export default function LiveExecutions() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
  fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
  try {
  setIsLoading(true);
  const response = await api.get('/executions');
  
  const liveOnly = (response.data.data || []).filter(ex => 
  ['pending','in_progress','failed'].includes(ex.status)
  );

  const sorted = liveOnly.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  setExecutions(sorted);
  } catch (error) {
  showAlert('danger', 'Failed to load executions.');
  } finally {
  setIsLoading(false);
  }
  };

  const getStatusBadge = (status) => {
  switch (status) {
  case'completed': return <Badge text="Completed" status="success" />;
  case'pending': return <Badge text="Pending" status="info" />;
  case'in_progress': return <Badge text="In Progress" status="warning" />;
  case'failed': return <Badge text="Failed" status="error" />;
  case'canceled': return <Badge text="Canceled" status="default" />;
  default: return <Badge text={status} status="default" />;
  }
  };

  const filteredExecutions = executions.filter(ex => {
  const searchLower = searchTerm.toLowerCase();
  const idMatch = (ex._id?.toLowerCase() || '').includes(searchLower);
  const nameMatch = (ex.workflow_id?.name?.toLowerCase() || '').includes(searchLower);
  const triggerMatch = (ex.triggered_by?.toLowerCase() || '').includes(searchLower);
  const matchesSearch = idMatch || nameMatch || triggerMatch;

  let matchesFilter = true;
  if (filterStatus !=='All') {
  const s = ex.status ||'';
  if (filterStatus ==='Pending') matchesFilter = s ==='pending';
  if (filterStatus ==='In Progress') matchesFilter = s ==='in_progress';
  if (filterStatus ==='Failed') matchesFilter = s ==='failed';
  }

  return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExecutions.length / recordsPerPage));
  const currentTableData = filteredExecutions.slice(
  (currentPage - 1) * recordsPerPage, 
  currentPage * recordsPerPage
  );

  const columns = [
  { 
    label:'Execution ID', 
    key:'_id', 
    render: (val) => (
      <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
        {val.substring(0, 8)}
      </span>
    ) 
  },
  { label:'Workflow', key:'workflow_id', render: (val) => (
    <span className="font-semibold text-gray-900">{val?.name ||'Unknown'}</span>
  )},
  { label:'Triggered By', key:'triggered_by', render: (val) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center">
        <User className="w-3 h-3 text-[#58bfa1]" />
      </div>
      <span className="text-sm text-gray-600">{val}</span>
    </div>
  )},
  { label:'Status', key:'status', render: getStatusBadge },
  { label:'Started', key:'started_at', render: (val) => (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Calendar className="w-3.5 h-3.5" />
      {new Date(val).toLocaleString()}
    </div>
  )},
  { 
    label:'Timeline', 
    key:'actions',
    align:'right',
    render: (_, item) => (
    <Button 
      variant="ghost" 
      color="primary" 
      size="sm"
      icon={Eye}
      onClick={() => navigate(`/execute/${item._id}`)}
    >
      View
    </Button>
    )
  }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
  
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
        <div className="p-2 bg-teal-50 rounded-lg">
          <Activity className="w-6 h-6 text-[#58bfa1]" />
        </div>
        Live Executions
      </h1>
      <p className="text-sm text-gray-500 mt-1">Monitor, cancel, and retry workflows across the entire organization.</p>
    </div>
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        color="secondary" 
        icon={RefreshCw}
        onClick={fetchExecutions}
        className="shrink-0"
      >
        Refresh
      </Button>
    </div>
    </div>

    {/* Stats Row */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Clock className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-bold text-gray-900">{executions.filter(e => e.status === 'pending').length}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Play className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-xl font-bold text-gray-900">{executions.filter(e => e.status === 'in_progress').length}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-2 bg-red-50 rounded-lg">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-xl font-bold text-gray-900">{executions.filter(e => e.status === 'failed').length}</p>
        </div>
      </div>
    </div>

    {/* Search & Filter */}
    <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 min-w-[200px] max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input 
        type="text" 
        placeholder="Search ID, Workflow, or User..." 
        value={searchTerm}
        onChange={(e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
        }}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#58bfa1]/20 focus:border-[#58bfa1] bg-white shadow-sm"
      />
    </div>
    
    <div className="relative">
      <button 
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors bg-white rounded-lg shadow-sm"
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">{filterStatus}</span>
      </button>
      
      {isFilterOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-lg z-50 py-1 overflow-hidden">
        {['All','Pending','In Progress','Failed'].map(type => (
          <button
            key={type}
            onClick={() => {
              setFilterStatus(type);
              setIsFilterOpen(false);
              setCurrentPage(1);
            }}
            className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
              filterStatus === type
              ?'bg-teal-50 text-[#58bfa1] font-semibold' 
              :'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {type}
          </button>
        ))}
        </div>
      )}
    </div>
    </div>

    {/* Table */}
    <div className="bg-white border border-gray-200 shadow-card rounded-xl overflow-hidden">
    {isLoading ? (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading executions...</p>
        </div>
      </div>
    ) : (
      <>
        <Table 
          columns={columns} 
          data={currentTableData} 
          emptyMessage="No executions match your criteria." 
        />
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredExecutions.length)} of {filteredExecutions.length}
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
