// client/src/pages/staff/Tasks.jsx
import React, { useState, useEffect } from 'react';
import { CheckSquare, Play, Clock, FileText, AlertCircle, Search, Filter as FilterIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';

export default function Tasks() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => { 
    if (user?.email) fetchInbox(); 
  }, [user]);

  const fetchInbox = async () => {
    try {
      const res = await api.get(`/executions/my-inbox?email=${user.email}`);
      setTasks(res.data.data.tasks || []);
    } catch (err) { 
      showAlert('danger', 'Failed to load tasks.'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/executions/${id}/respond`, { action: 'approve', email: user.email }); 
      showAlert('success', `Task marked as complete!`);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (err) { 
      showAlert('danger', `Failed to complete task.`); 
    }
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    const submittedTime = new Date(task.submittedAt || task.createdAt || Date.now());
    const hoursDiff = (new Date() - submittedTime) / (1000 * 60 * 60);
    return hoursDiff > 24;
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.workflowName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.stepName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'overdue' && isOverdue(task)) ||
      (filterStatus === 'pending' && !isOverdue(task));
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500">Loading tasks...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manual actions required to move workflows forward.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {tasks.length} pending task{tasks.length !== 1 ? 's' : ''}
          </span>
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
            placeholder="Search tasks..." 
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
            {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg z-50 py-1">
              {['all', 'pending', 'overdue'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setIsFilterOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filterStatus === status 
                      ? 'bg-teal-50 text-[#58bfa1] font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <CheckSquare className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-sm text-gray-500">No pending tasks assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredTasks.map(task => (
            <div 
              key={task._id} 
              className={`bg-white border rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                isOverdue(task) ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-200'
              }`}
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${isOverdue(task) ? 'bg-red-100' : 'bg-amber-100'}`}>
                    {isOverdue(task) ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckSquare className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{task.stepName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Part of: {task.workflowName}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  isOverdue(task) 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {isOverdue(task) ? 'OVERDUE' : 'PENDING'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Task ID */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Assigned: {new Date(task.submittedAt || task.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <span className="font-mono">ID: {task._id?.substring(0, 8)}</span>
                </div>

                {/* Task Instructions (if available) */}
                {task.instructions && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700">{task.instructions}</p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  variant="solid" 
                  color="primary" 
                  onClick={() => handleComplete(task._id)}
                  className="w-full justify-center"
                >
                  <Play className="w-4 h-4 mr-2" /> Mark as Complete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
