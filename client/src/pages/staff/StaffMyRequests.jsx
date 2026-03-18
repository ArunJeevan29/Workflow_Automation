// client/src/pages/staff/StaffMyRequests.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Filter, Clock, CheckCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';

export default function StaffMyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 7;

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch executions and filter for current staff's own requests
      const exResponse = await api.get('/executions');
      const allExecutions = exResponse.data.data || [];
      
      // Filter: staff's own executions (in_progress, pending only)
      const myExecutions = allExecutions.filter(ex => 
        ex.triggered_by === user.email && 
        (ex.status === 'in_progress' || ex.status === 'pending')
      );
      
      setMyRequests(myExecutions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at)));
    } catch (error) {
      console.error("Failed to load requests data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter my requests
  const filteredRequests = myRequests.filter(ex => {
    const searchLower = searchTerm.toLowerCase();
    const idMatch = (ex._id?.toLowerCase() || '').includes(searchLower);
    const nameMatch = (ex.workflow_id?.name?.toLowerCase() || '').includes(searchLower);
    const matchesSearch = idMatch || nameMatch;

    let matchesFilter = true;
    if (filterStatus !== 'All') {
      const s = ex.status || 'pending';
      if (filterStatus === 'Pending') matchesFilter = s === 'pending' || s === 'in_progress';
    }

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / recordsPerPage));
  const currentTableData = filteredRequests.slice(
    (currentPage - 1) * recordsPerPage, 
    currentPage * recordsPerPage
  );

  const getStatusBadge = (status) => {
    if (status === 'completed') return <Badge text="Completed" status="success" />;
    if (status === 'failed' || status === 'canceled') return <Badge text="Failed" status="error" />;
    if (status === 'in_progress') return <Badge text="In Progress" status="warning" />;
    return <Badge text="Pending" status="info" />;
  };

  const columns = [
    { 
      label: 'Request ID', 
      key: '_id', 
      render: (val) => (
        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100">
          {val.substring(0, 8)}
        </span>
      ) 
    },
    { 
      label: 'Workflow Type', 
      key: 'workflow_id', 
      render: (val) => <span className="font-semibold text-gray-900">{val?.name || 'Unknown'}</span> 
    },
    { 
      label: 'Status', 
      key: 'status', 
      render: (val) => getStatusBadge(val) 
    },
    { 
      label: 'Submitted On', 
      key: 'started_at', 
      render: (val) => <span className="text-sm text-gray-500">{new Date(val).toLocaleDateString()}</span> 
    },
    { 
      label: 'Track Status', 
      key: 'actions',
      align: 'right',
      render: (_, item) => (
        <button 
          onClick={() => navigate(`/execute/${item._id}`)} 
          className="px-3 py-1.5 text-xs font-medium border transition-colors text-[#58bfa1] border-teal-200 bg-teal-50 hover:bg-teal-100"
        >
          Track Status
        </button>
      )
    }
  ];

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
    
    {/* My Requests - Only In Progress */}
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#58bfa1]" /> My Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track your in-progress requests.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData} 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by ID or workflow..." 
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
                <span className="hidden sm:inline">{filterStatus}</span>
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 shadow-lg z-50 py-1">
                  {['All', 'Pending'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setIsFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filterStatus === status 
                          ? 'bg-teal-50 text-[#58bfa1] font-semibold' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-xl overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 rounded-full">
              <ClipboardList className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700">
              {searchTerm ? 'No requests match your search.' : 'You have no in-progress requests.'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ? 'Try a different search term.' : 'Completed requests will appear in History.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <div className="inline-block min-w-full align-middle">
                <Table 
                  columns={columns} 
                  data={currentTableData} 
                  emptyMessage="No requests found." 
                />
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                <span className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredRequests.length)} of {filteredRequests.length}
                </span>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
