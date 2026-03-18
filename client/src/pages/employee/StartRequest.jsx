// client/src/pages/employee/StartRequest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios';
import Badge from '../../components/Badge';

export default function StartRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWorkflows();
  }, [user]);

  const fetchWorkflows = async () => {
    try {
      const wfResponse = await api.get('/workflows');
      const allWorkflows = wfResponse.data.data || [];
      // Only show active workflows
      const activeOnly = allWorkflows.filter(wf => wf.is_active === true);
      setWorkflows(activeOnly);
    } catch (error) {
      console.error("Failed to load workflows");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter workflows by search term
  const filteredWorkflows = workflows.filter(wf => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (wf.name?.toLowerCase() || '').includes(searchLower);
    const descMatch = (wf.description?.toLowerCase() || '').includes(searchLower);
    return nameMatch || descMatch;
  });

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Play className="w-5 h-5 text-[#58bfa1]" /> Start Request
        </h1>
        <p className="text-sm text-gray-500 mt-1">Select an active workflow to submit a new request.</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search workflows..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-4 py-2 border border-gray-200 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#58bfa1] focus:border-[#58bfa1]" 
        />
      </div>

      {/* Workflow Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No workflows match your search' : 'No Active Workflows'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'Try a different search term.' : 'There are no active workflows available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map(wf => (
            <div 
              key={wf._id} 
              className="bg-white p-6 border border-gray-200 shadow-sm hover:border-[#58bfa1] transition-all flex flex-col justify-between h-full group rounded-xl"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-gray-50 text-gray-500 border border-gray-100 group-hover:text-[#58bfa1] group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge text="Active" status="success" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{wf.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{wf.description || 'Submit a new request for this process.'}</p>
              </div>
              <button 
                onClick={() => navigate(`/execute/${wf._id}`)}
                className="mt-6 w-full py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium group-hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 rounded-lg"
              >
                Launch Request <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#58bfa1]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
