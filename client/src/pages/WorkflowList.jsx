// client/src/pages/WorkflowList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { Search, Filter, Play, Edit2, Plus, Trash2, ChevronDown, History, X, GitBranch, RefreshCw } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useConfirm } from '../context/ConfirmContext';

import Table from '../components/Table';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';

export default function WorkflowList() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { confirmAction } = useConfirm();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkflowsCount, setTotalWorkflowsCount] = useState(0);
  const recordsPerPage = 8;

  // Version History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentWorkflowName, setCurrentWorkflowName] = useState('');

  const fetchWorkflows = useCallback(async (search = '', page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page, limit: recordsPerPage });
      if (search.trim()) params.append('search', search.trim());
      
      const response = await api.get(`/workflows?${params.toString()}`);
      let allData = response.data.data || [];
      
      setWorkflows(allData);
      setTotalPages(response.data.pages || 1);
      setTotalWorkflowsCount(response.data.total || 0);
    } catch (error) {
      console.error(error);
      showAlert('danger', 'Failed to load workflows.');
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchWorkflows(searchTerm, currentPage);
  }, [currentPage, fetchWorkflows]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchWorkflows(searchTerm, 1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchWorkflows]);

  const handleDelete = async (workflowId, workflowName) => {
    const confirmed = await confirmAction({
      title: 'Archive Workflow',
      message: `Are you sure you want to archive "${workflowName}"? It will no longer appear in the list.`,
      type: 'danger',
      confirmText: 'Archive'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/workflows/${workflowId}`);
      showAlert('success', `"${workflowName}" archived.`);
      fetchWorkflows(searchTerm, currentPage);
    } catch (error) {
      showAlert('danger', 'Failed to archive workflow.');
    }
  };

  const handleViewVersions = async (workflow) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setCurrentWorkflowName(workflow.name);
    try {
      const parentId = workflow.parent_id || workflow._id;
      const response = await api.get(`/workflows?parent_id=${parentId}`);
      setSelectedHistory(response.data.data || []);
    } catch (error) {
      showAlert('danger', 'Failed to load version history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderStatus = (isActive) => (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58bfa1] opacity-40"></span>}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-[#58bfa1]' : 'bg-gray-300'}`}></span>
      </span>
      <span className={`font-semibold text-xs ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{isActive ? 'Active' : 'Inactive'}</span>
    </div>
  );

  const columns = [
    { 
      label: 'ID', 
      key: '_id',
      render: (val) => (
        <div className="group relative inline-block">
          <span className="text-[#58bfa1] font-semibold font-mono text-xs bg-teal-50 border border-teal-100 px-2 py-1 rounded-md cursor-help">
            {val.substring(0, 8)}...
          </span>
          <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1.5 px-3 rounded shadow-xl z-[100] font-mono whitespace-nowrap">
            {val}
          </div>
        </div>
      )
    },
    { label: 'Name', key: 'name', render: (val) => <span className="font-bold text-gray-900">{val}</span> },
    { label: 'Steps', key: 'steps', render: (val) => <span className="text-gray-600 font-medium">{val ? val.length : 0}</span> },
    { label: 'Version', key: 'version', render: (val) => <span className="text-gray-500 font-medium">v{val || 1}</span> },
    { label: 'Status', key: 'is_active', render: renderStatus },
    { 
      label: '', key: 'actions', align: 'center', isAction: true, 
      render: (_, workflow) => (
        <div className="flex justify-center relative">
          <ActionMenu 
            actions={[
              { label: 'Edit Blueprint', icon: Edit2, onClick: () => navigate(`/workflow/${workflow._id}`) },
              { label: 'Version History', icon: History, onClick: () => handleViewVersions(workflow) },
              { label: 'Run Execution', icon: Play, onClick: () => navigate(`/execute/${workflow._id}`) },
              { label: 'Archive', icon: Trash2, danger: true, onClick: () => handleDelete(workflow._id, workflow.name) }
            ]}
          />
        </div>
      )
    }
  ];

  // Apply local sorting based on the new filter options
  let displayData = [...workflows];
  if (filterType === 'Version') {
    displayData.sort((a, b) => b.version - a.version);
  } else if (filterType === 'Steps') {
    displayData.sort((a, b) => (b.steps?.length || 0) - (a.steps?.length || 0));
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-7xl mx-auto">
      
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <GitBranch className="w-6 h-6 text-[#58bfa1]" />
            </div>
            Workflows
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Design, manage, and execute all automation blueprints.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="solid" 
            color="primary" 
            onClick={() => navigate('/workflow/new')} 
            icon={Plus}
            className="shadow-md hover:shadow-lg"
          >
            Create Workflow
          </Button>
          <button 
            onClick={() => fetchWorkflows(searchTerm, currentPage)} 
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Workflows</p>
          <p className="text-2xl font-bold text-gray-900">{totalWorkflowsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{workflows.filter(w => w.is_active).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{workflows.filter(w => !w.is_active).length}</p>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-3 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search workflows..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#58bfa1] transition-all bg-white font-medium placeholder:text-gray-400 shadow-sm"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 bg-white text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Sort: {filterType}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isFilterOpen && (
            <div className="absolute left-0 mt-2 w-36 bg-white border border-gray-100 shadow-lg rounded-lg z-50 py-1.5 overflow-hidden">
              {['All', 'Version', 'Steps'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setIsFilterOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${filterType === type ? 'bg-teal-50/50 text-[#58bfa1] font-bold' : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading workflows...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <Table columns={columns} data={displayData} emptyMessage="No workflows found." />
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-xl shadow-sm">
            <span className="text-xs font-medium text-gray-500">
              Showing {displayData.length} of {totalWorkflowsCount} workflows
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#58bfa1]" /> Version History
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{currentWorkflowName}</p>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {historyLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-6 h-6 border-2 border-[#58bfa1] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Version</th>
                        <th className="px-6 py-3">Created</th>
                        <th className="px-6 py-3 text-center">Steps</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedHistory.map((v) => (
                        <tr key={v._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">v{v.version}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-600">{new Date(v.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5 text-sm text-gray-600 font-medium text-center">{v.steps?.length || 0}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${v.is_active ? 'bg-teal-50 text-[#58bfa1]' : 'bg-gray-100 text-gray-500'}`}>
                              {v.is_active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
