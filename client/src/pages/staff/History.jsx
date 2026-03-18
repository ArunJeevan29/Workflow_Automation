// client/src/pages/staff/History.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter as FilterIcon, ChevronDown, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';

export default function History() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => { 
    if (user?.email) fetchCombinedHistory(); 
  }, [user]);

  const fetchCombinedHistory = async () => {
    try {
      setIsLoading(true);
      const combined = [];

      // 1. Fetch Approvals History
      try {
        const resApprovals = await api.get(`/executions/my-inbox?email=${user.email}`);
        const approvals = resApprovals.data.data.history || [];
        approvals.forEach(app => {
          combined.push({
            id: app.executionId,
            type: 'Approval',
            workflowName: app.workflowName,
            stepName: app.stepName,
            detail: '',
            action: app.action,
            date: app.date
          });
        });
      } catch (e) {
        console.error("Failed to fetch approvals history");
      }

      // 2. Fetch Archived Notifications
      try {
        const resExec = await api.get('/executions');
        const allExec = resExec.data.data || [];
        const readIds = JSON.parse(localStorage.getItem(`read_notifs_${user.email}`) || '[]');

        allExec.forEach(ex => {
          (ex.logs || []).forEach((log, index) => {
            if (log.step_type === 'notification' && log.error_message?.includes(user.email)) {
              const uniqueAlertId = `${ex._id}-${index}`;
              
              if (readIds.includes(uniqueAlertId)) {
                const msgMatch = log.error_message.match(/"([^"]+)"/);
                const cleanMessage = msgMatch ? msgMatch[1] : log.error_message;

                combined.push({
                  id: uniqueAlertId,
                  type: 'Notification',
                  workflowName: ex.workflow_id?.name || 'Unknown',
                  stepName: log.step_name,
                  detail: cleanMessage,
                  action: 'read',
                  date: log.ended_at || log.started_at
                });
              }
            }
          });
        });
      } catch (e) {
        console.error("Failed to fetch notifications history");
      }

      // Sort combined array by date descending
      combined.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(combined);
    } catch (err) { 
      showAlert('danger', 'Failed to load history.'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  // Filter by date range
  const filterByDate = (item) => {
    const itemDate = new Date(item.date);
    const now = new Date();
    
    switch(dateRange) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      default:
        return true;
    }
  };

  // Search & Filter Logic
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      (item.workflowName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.stepName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.detail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || item.type === filterType.replace(/s$/, '');
    const matchesStatus = filterStatus === 'All' || item.action === filterStatus.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus && filterByDate(item);
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / recordsPerPage));
  const currentData = filteredHistory.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const columns = [
    { 
      label: 'Type', 
      key: 'type', 
      render: (val, item) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${val === 'Approval' ? 'bg-blue-50' : 'bg-gray-100'}`}>
            {val === 'Approval' ? (
              <CheckCircle className="w-4 h-4 text-blue-600" />
            ) : (
              <FileText className="w-4 h-4 text-gray-600" />
            )}
          </div>
          <Badge text={val} status={val === 'Approval' ? 'info' : 'default'} />
        </div>
      ) 
    },
    { 
      label: 'Workflow / Step', 
      key: 'workflowName', 
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{item.workflowName}</span>
          <span className="text-xs text-gray-500">{item.stepName} {item.detail && ` - "${item.detail}"`}</span>
        </div>
      ) 
    },
    { 
      label: 'Status', 
      key: 'action', 
      render: (val) => {
        if (val === 'completed') return <Badge text="Approved" status="success" />;
        if (val === 'failed' || val === 'rejected') return <Badge text="Rejected" status="error" />;
        if (val === 'read') return <span className="text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50 px-2 py-1">Marked Read</span>;
        return <Badge text={val} status="default" />;
      } 
    },
    { 
      label: 'Date Processed', 
      key: 'date', 
      render: (val) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-mono text-gray-600">{new Date(val).toLocaleString()}</span>
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
            History
          </h1>
          <p className="text-sm text-gray-500 mt-1">A historical record of all tasks and alerts you have processed.</p>
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-4 py-2 border border-gray-200 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#58bfa1] focus:border-[#58bfa1]" 
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FilterIcon className="w-4 h-4 text-gray-500" />
            {filterType}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-50 py-1 rounded-lg">
              {['All', 'Approvals', 'Notifications'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setIsFilterOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterType === type 
                      ? 'bg-teal-50 text-[#58bfa1] font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-200 text-gray-700 bg-white text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="completed">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="read">Marked Read</option>
        </select>

        {/* Date Filter */}
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-200 text-gray-700 bg-white text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{currentData.length}</span> of <span className="font-semibold text-gray-900">{filteredHistory.length}</span> results
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <div className="inline-block min-w-full align-middle">
                <Table 
                  columns={columns} 
                  data={currentData} 
                  emptyMessage="No history found matching your filters." 
                />
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                <span className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredHistory.length)}
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
