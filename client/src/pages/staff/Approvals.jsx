// client/src/pages/staff/Approvals.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileText, Clock, AlertTriangle, Inbox, User, Search, Filter as FilterIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

export default function Approvals() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (user?.email) fetchInbox();
  }, [user]);

  const fetchInbox = async () => {
    try {
      const res = await api.get(`/executions/my-inbox?email=${user.email}`);
      setApprovals(res.data.data.approvals || []);
    } catch (err) {
      showAlert('danger', 'Failed to load approvals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const response = await api.post(`/executions/${id}/respond`, { action, email: user.email });
      
      // THE FIX: Strict payload validation to ensure the backend actually saved it
      // before we optimistically remove it from the UI!
      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Action failed on the server.');
      }

      showAlert('success', `Task ${action}ed successfully!`);
      setApprovals(prev => prev.filter(task => task._id !== id));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || `Failed to process action.`;
      showAlert('danger', errorMsg);
    }
  };

  // Filter approvals
  const filteredApprovals = approvals.filter(item => {
    const matchesSearch = 
      item.workflowName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stepName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.triggered_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Check if item is overdue (more than 24 hours)
  const isOverdue = (item) => {
    const submittedTime = new Date(item.submittedAt || item.createdAt || Date.now());
    const hoursDiff = (new Date() - submittedTime) / (1000 * 60 * 60);
    return hoursDiff > 24;
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Loading approvals...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
              <Inbox className="w-6 h-6 text-amber-600" />
            </div>
            Inbox
          </h1>
          <p className="text-sm text-gray-500 mt-1">Workflows waiting for your approval decision.</p>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex items-center gap-3">
        <button 
          onClick={fetchInbox} 
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by workflow, step..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#58bfa1] focus:border-[#58bfa1]" 
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FilterIcon className="w-4 h-4 text-gray-500" />
            {filterPriority === 'all' ? 'All Priority' : filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg z-50 py-1">
              {['all', 'high', 'medium', 'low'].map(priority => (
                <button
                  key={priority}
                  onClick={() => {
                    setFilterPriority(priority);
                    setIsFilterOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterPriority === priority 
                      ? 'bg-teal-50 text-[#58bfa1] font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {priority === 'all' ? 'All Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredApprovals.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-sm text-gray-500">No pending approvals. You're all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredApprovals.map(task => (
            <div 
              key={task._id} 
              className={`bg-white border rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                isOverdue(task) ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-200'
              }`}
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${isOverdue(task) ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {isOverdue(task) ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{task.workflowName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Step: {task.stepName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority || 'medium')}`}>
                    {(task.priority || 'medium').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Requester Info */}
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Requested by:</span>
                  <span className="text-sm font-semibold text-gray-900">{task.triggered_by}</span>
                </div>

                {/* Data Fields */}
                {task.data && Object.keys(task.data).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(task.data).slice(0, 4).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-xs text-gray-500 capitalize block">{k.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-semibold text-gray-900">{String(v)}</span>
                        </div>
                      ))}
                      {Object.keys(task.data).length > 4 && (
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500">+{Object.keys(task.data).length - 4} more fields</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Time & ID */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(task.started_at || task.submittedAt || task.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <span className="font-mono">ID: {task._id?.substring(0, 8)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="solid" 
                    color="primary" 
                    onClick={() => handleAction(task._id, 'approve')}
                    className="flex-1 justify-center bg-green-600 hover:bg-green-700 border-green-600"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button 
                    variant="solid" 
                    color="error"
                    onClick={() => handleAction(task._id, 'reject')}
                    className="flex-1 justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}